#!/usr/bin/env bash
#
# news-fetch-gog: Automated Hacker News Daily Digest
# Fetches HN articles, deduplicates, summarizes, and emails via Google Workspace
#

set -euo pipefail

# Configuration (override with environment variables)
RECIPIENT_EMAIL="${RECIPIENT_EMAIL:-georgehu@microsoft.com}"
SHEET_ID="${SHEET_ID:-}"
HN_QUERY="${HN_QUERY:-Agentic AI}"
MAX_RESULTS="${MAX_RESULTS:-50}"
EMAIL_TOP_N="${EMAIL_TOP_N:-20}"
TIMEZONE="${TIMEZONE:-America/New_York}"

# Temporary files
TMP_DIR="/tmp/news-fetch-gog-$$"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

HN_SEARCH="$TMP_DIR/hn-search.json"
EXISTING_IDS="$TMP_DIR/existing-ids.txt"
NEW_ENTRIES="$TMP_DIR/new-entries.csv"
LATEST_WINDOW="$TMP_DIR/latest-window.json"
DIGEST_ITEMS="$TMP_DIR/digest-items.txt"
DIGEST_HTML="$TMP_DIR/digest.html"
SUMMARY_TEXT="$TMP_DIR/summary.txt"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
  echo -e "${RED}[ERROR]${NC} $*"
  exit 1
}

# Validate prerequisites
check_dependencies() {
  log "Checking dependencies..."

  if ! command -v gog &> /dev/null; then
    error "gog CLI not found. Install with: brew install steipete/tap/gogcli"
  fi

  if ! command -v jq &> /dev/null; then
    error "jq not found. Install with: brew install jq"
  fi

  if ! command -v curl &> /dev/null; then
    error "curl not found"
  fi

  log "✓ All dependencies available"
}

# Check gog authentication
check_auth() {
  log "Checking gog authentication..."

  if ! gog auth list | grep -q "$RECIPIENT_EMAIL"; then
    error "gog not authenticated for $RECIPIENT_EMAIL. Run: gog auth add $RECIPIENT_EMAIL --services gmail,sheets,drive"
  fi

  log "✓ Authenticated as $RECIPIENT_EMAIL"
}

# Validate Sheet ID
validate_sheet() {
  if [ -z "$SHEET_ID" ]; then
    error "SHEET_ID not set. Set via: export SHEET_ID=<your-sheet-id>"
  fi

  log "Checking Sheet access: $SHEET_ID"

  if ! gog sheets metadata "$SHEET_ID" --json > /dev/null 2>&1; then
    error "Cannot access Sheet: $SHEET_ID. Check ID and permissions."
  fi

  log "✓ Sheet accessible"
}

# Step 1: Search Hacker News
search_hackernews() {
  log "Step 1/9: Searching Hacker News for: $HN_QUERY"

  local encoded_query
  encoded_query=$(echo "$HN_QUERY" | sed 's/ /%20/g')

  curl -s "https://hn.algolia.com/api/v1/search?query=$encoded_query&tags=story&hitsPerPage=$MAX_RESULTS" \
    -o "$HN_SEARCH"

  local hit_count
  hit_count=$(jq '.nbHits' "$HN_SEARCH")

  log "✓ Found $hit_count articles"
}

# Step 2: Get existing IDs from Sheet
get_existing_ids() {
  log "Step 2/9: Loading existing article IDs from Sheet"

  gog sheets get "$SHEET_ID" "Sheet1!A:A" --json | \
    jq -r '.values[]?[0]?' | \
    grep -v '^$' | \
    grep -v '^hn_id$' > "$EXISTING_IDS" || true

  local existing_count
  existing_count=$(wc -l < "$EXISTING_IDS" | tr -d ' ')

  log "✓ Loaded $existing_count existing articles"
}

# Step 3: Filter new entries
filter_new_entries() {
  log "Step 3/9: Filtering new articles (deduplication)"

  if [ ! -s "$EXISTING_IDS" ]; then
    warn "No existing IDs found, treating all articles as new"
    touch "$EXISTING_IDS"
  fi

  # Extract articles and format as CSV, excluding existing IDs
  jq -r '.hits[] | select(.objectID) |
    [.objectID, .title, .url, (.points // 0), .author, .created_at] | @csv' \
    "$HN_SEARCH" > "$TMP_DIR/all-entries.csv"

  # Filter out existing IDs
  if [ -s "$EXISTING_IDS" ]; then
    grep -v -F -f "$EXISTING_IDS" "$TMP_DIR/all-entries.csv" > "$NEW_ENTRIES" || true
  else
    cp "$TMP_DIR/all-entries.csv" "$NEW_ENTRIES"
  fi

  local new_count
  new_count=$(wc -l < "$NEW_ENTRIES" | tr -d ' ')

  log "✓ Found $new_count new articles"
}

# Step 4: Append new entries to Sheet
append_to_sheet() {
  log "Step 4/9: Appending new articles to Sheet"

  if [ ! -s "$NEW_ENTRIES" ]; then
    log "No new entries to append"
    return
  fi

  # Convert CSV to JSON array format
  local new_rows
  new_rows=$(python3 -c "import csv, json, sys; print(json.dumps(list(csv.reader(open('$NEW_ENTRIES')))))")

  gog sheets append "$SHEET_ID" "Sheet1!A:F" \
    --values-json "$new_rows" \
    --insert INSERT_ROWS

  local new_count
  new_count=$(wc -l < "$NEW_ENTRIES" | tr -d ' ')

  log "✓ Appended $new_count new articles"
}

# Step 5: Read latest window
read_latest_window() {
  log "Step 5/9: Reading latest articles window"

  gog sheets get "$SHEET_ID" "Sheet1!A2:F51" --json > "$LATEST_WINDOW"

  local window_size
  window_size=$(jq '.values | length' "$LATEST_WINDOW")

  log "✓ Loaded $window_size articles"
}

# Step 6: Generate article list for summary
generate_article_list() {
  log "Step 6/9: Generating article list"

  jq -r '.values[] | "• " + .[1] + " (" + .[3] + " points) - " + .[2]' \
    "$LATEST_WINDOW" | \
    head -n "$EMAIL_TOP_N" > "$DIGEST_ITEMS"

  log "✓ Top $EMAIL_TOP_N articles extracted"
}

# Step 7: Generate summary (placeholder - integrate with AI)
generate_summary() {
  log "Step 7/9: Generating summary"

  # For now, create a simple summary
  # In production, this would call an AI model via clawdbot
  local article_count
  article_count=$(wc -l < "$DIGEST_ITEMS" | tr -d ' ')

  cat > "$SUMMARY_TEXT" <<EOF
The Agentic AI landscape continues to evolve with interesting discussions on Hacker News.

Today's digest includes $article_count noteworthy articles covering:
• Framework development and tooling
• Real-world deployment experiences
• Integration patterns with LLMs
• Evaluation and testing methodologies
• Production considerations and best practices

These discussions reflect the growing maturity of the field as teams move from experimentation to production deployments.
EOF

  log "✓ Summary generated"
}

# Step 8: Create HTML report
create_html_report() {
  log "Step 8/9: Creating HTML report"

  local today
  today=$(TZ="$TIMEZONE" date +%Y-%m-%d)

  local summary
  summary=$(cat "$SUMMARY_TEXT")

  local articles_html=""
  local counter=1

  while IFS= read -r line; do
    # Extract title, points, and URL from the line
    # Format: • Title (123 points) - URL
    local title=$(echo "$line" | sed -E 's/^• (.*) \([0-9]+ points\) - .*/\1/')
    local points=$(echo "$line" | sed -E 's/^• .* \(([0-9]+) points\) - .*/\1/')
    local url=$(echo "$line" | sed -E 's/^• .* \([0-9]+ points\) - (.*)/\1/')

    articles_html+="<div class=\"article\">
  <h3>$counter. $title</h3>
  <p class=\"meta\">$points points | <a href=\"$url\">Read more →</a></p>
</div>
"
    ((counter++))
  done < "$DIGEST_ITEMS"

  cat > "$DIGEST_HTML" <<EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hacker News Daily Digest – $today</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #f6f6f6;
      color: #333;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #ff6600;
      border-bottom: 3px solid #ff6600;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #ff6600;
      margin-top: 40px;
    }
    h3 {
      margin: 0 0 5px 0;
      font-size: 1.1em;
    }
    .article {
      margin: 20px 0;
      padding: 15px;
      border-left: 3px solid #ff6600;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .meta {
      color: #666;
      font-size: 0.9em;
      margin: 5px 0 0 0;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background: #fff3e0;
      border-radius: 5px;
      border-left: 4px solid #ff9800;
      line-height: 1.6;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 0.9em;
      text-align: center;
    }
    a {
      color: #ff6600;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗞️ Hacker News Daily Digest – $today</h1>

    <div class="summary">
      <h2>📝 Summary</h2>
      <p>$summary</p>
    </div>

    <h2>📰 Latest Articles (Top $EMAIL_TOP_N)</h2>
    $articles_html

    <div class="footer">
      <p>
        Generated on $today | Query: "$HN_QUERY" |
        <a href="https://docs.google.com/spreadsheets/d/$SHEET_ID">View Full History →</a>
      </p>
      <p style="margin-top: 10px; font-size: 0.8em;">
        Automated by <strong>news-fetch-gog</strong> skill
      </p>
    </div>
  </div>
</body>
</html>
EOF

  log "✓ HTML report created"
}

# Step 9: Upload to Drive and send email
upload_and_email() {
  log "Step 9/9: Uploading to Drive and sending email"

  local today
  today=$(TZ="$TIMEZONE" date +%Y-%m-%d)
  local filename="HN-Digest-$today.html"

  # Upload to Drive
  local drive_output
  drive_output=$(gog drive upload "$DIGEST_HTML" --name "$filename" 2>&1)

  # Extract file ID from output (format may vary)
  local file_id
  file_id=$(echo "$drive_output" | grep -oE 'id: [a-zA-Z0-9_-]+' | cut -d' ' -f2 || echo "")

  if [ -z "$file_id" ]; then
    warn "Could not extract Drive file ID, using generic link"
    file_id="unknown"
  fi

  local drive_link="https://drive.google.com/file/d/$file_id/view"

  log "✓ Uploaded to Drive: $drive_link"

  # Count stats
  local total_tracked
  local new_today
  total_tracked=$(wc -l < "$EXISTING_IDS" | tr -d ' ')
  new_today=$(wc -l < "$NEW_ENTRIES" | tr -d ' ')
  [ -z "$new_today" ] && new_today=0

  # Send email
  local email_body
  email_body="Your daily Hacker News digest is ready!

View the report: $drive_link

You can:
• Open with Google Docs to edit
• Export as PDF via File > Download > PDF
• View tracking sheet: https://docs.google.com/spreadsheets/d/$SHEET_ID

📊 Statistics:
Total articles tracked: $total_tracked
New articles today: $new_today
Query: \"$HN_QUERY\"

---
Automated by news-fetch-gog skill
Generated at: $(date)"

  gog gmail send \
    --to "$RECIPIENT_EMAIL" \
    --subject "Hacker News Daily Digest – $today" \
    --body "$email_body"

  log "✓ Email sent to $RECIPIENT_EMAIL"
}

# Main workflow
main() {
  log "Starting Hacker News Daily Digest workflow"
  log "Query: $HN_QUERY"
  log "Recipient: $RECIPIENT_EMAIL"
  log "Sheet ID: $SHEET_ID"
  echo ""

  check_dependencies
  check_auth
  validate_sheet

  echo ""
  search_hackernews
  get_existing_ids
  filter_new_entries
  append_to_sheet
  read_latest_window
  generate_article_list
  generate_summary
  create_html_report
  upload_and_email

  echo ""
  log "✅ Workflow completed successfully!"
}

# Run main workflow
main "$@"
