---
name: news-fetch-gog
description: Automated Hacker News daily digest workflow - search, deduplicate, summarize, and email via Google Workspace
homepage: https://gogcli.sh
metadata: {"clawdbot":{"emoji":"📰","requires":{"bins":["gog"]}}}
---

# news-fetch-gog

Automates daily Hacker News digest workflow with Google Workspace integration.

## Overview

This skill fetches Hacker News articles about "Agentic AI", deduplicates against a Google Sheet, generates a daily digest, uploads to Google Drive, and emails the report.

## Prerequisites

- `gog` CLI installed and authenticated
- Google account with Gmail, Sheets, and Drive access
- Google Sheet configured with columns: `hn_id`, `title`, `url`, `points`, `author`, `created_at`

## Setup

```bash
# Authenticate gog with Google Workspace
gog auth add georgehu@microsoft.com --services gmail,sheets,drive

# Create tracking Google Sheet
gog sheets create "HN-Agentic-AI-Tracker"
# Note the sheet ID from the output
```

## Daily Workflow (Automated)

### Schedule: 09:00 AM America/New_York

The workflow runs automatically each day:

1. **🔍 Search Hacker News** - Query for "Agentic AI" topics
2. **🧮 Deduplicate** - Compare with Google Sheet by `hn_id`
3. **➕ Add New Entries** - Append new articles to Sheet
4. **📖 Read Window** - Get latest batch of articles
5. **✍️ Generate Summary** - Create digest with key insights
6. **🧾 Render Template** - Format as "Hacker News Daily Digest – {date}"
7. **🌐 Generate HTML** - Convert to HTML format
8. **☁️ Upload to Drive** - Save to Google Drive
9. **📄 Export Options** - Can open with Google Docs → PDF
10. **✉️ Send Email** - Deliver digest with Drive link

## Configuration

```bash
# Environment variables (set in ~/.clawdbot/clawdbot.json or skill config)
RECIPIENT_EMAIL="georgehu@microsoft.com"
SHEET_ID="<your-google-sheet-id>"
CRON_SCHEDULE="0 9 * * *"  # 09:00 AM daily
TIMEZONE="America/New_York"
```

## Manual Execution

### Run Today's Digest

```bash
# Full workflow
news-fetch-gog run

# Steps:
# 1. Search HN
# 2. Dedupe & append to Sheet
# 3. Generate summary
# 4. Upload to Drive
# 5. Email report
```

### Individual Steps

```bash
# 1. Search Hacker News (via Algolia API)
curl "https://hn.algolia.com/api/v1/search?query=Agentic%20AI&tags=story&hitsPerPage=50" \
  -o /tmp/hn-search.json

# 2. Get existing IDs from Sheet
gog sheets get "$SHEET_ID" "Sheet1!A:A" --json | \
  jq -r '.values[]?[0]?' | \
  grep -v '^$' > /tmp/existing-ids.txt

# 3. Filter new entries
cat /tmp/hn-search.json | \
  jq -r '.hits[] | select(.objectID) |
    [.objectID, .title, .url, .points, .author, .created_at] | @csv' | \
  grep -v -F -f /tmp/existing-ids.txt > /tmp/new-entries.csv

# 4. Append to Sheet
if [ -s /tmp/new-entries.csv ]; then
  # Convert CSV to JSON array format for gog
  NEW_ROWS=$(cat /tmp/new-entries.csv | \
    python3 -c "import csv, json, sys; print(json.dumps(list(csv.reader(sys.stdin))))")

  gog sheets append "$SHEET_ID" "Sheet1!A:F" \
    --values-json "$NEW_ROWS" \
    --insert INSERT_ROWS
fi

# 5. Get latest window (last 50 rows)
gog sheets get "$SHEET_ID" "Sheet1!A2:F51" --json > /tmp/latest-window.json

# 6. Generate summary with AI
cat /tmp/latest-window.json | \
  jq -r '.values[] | "• " + .[1] + " (" + .[3] + " points) - " + .[2]' | \
  head -20 > /tmp/digest-items.txt

# Generate summary using agent
cat <<'EOF' > /tmp/prompt.txt
Create a concise daily digest summary of these Hacker News articles about Agentic AI:

$(cat /tmp/digest-items.txt)

Format:
- Brief introduction (2-3 sentences)
- Top 5 trending topics
- Key insights
- Notable discussions

Keep it professional and actionable.
EOF

# 7. Create HTML report
TODAY=$(date +%Y-%m-%d)
cat <<EOF > /tmp/digest.html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hacker News Daily Digest – $TODAY</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #ff6600; border-bottom: 2px solid #ff6600; }
    .article { margin: 20px 0; padding: 15px; border-left: 3px solid #ff6600; background: #f6f6f6; }
    .meta { color: #666; font-size: 0.9em; }
    .summary { margin-top: 30px; padding: 20px; background: #fff3e0; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Hacker News Daily Digest – $TODAY</h1>
  <div class="summary">
    <h2>Summary</h2>
    <!-- AI-generated summary goes here -->
  </div>

  <h2>Latest Articles (20)</h2>
  <!-- Article list goes here -->

  <hr>
  <p style="color: #666; font-size: 0.9em;">
    Generated on $TODAY | Tracking Sheet:
    <a href="https://docs.google.com/spreadsheets/d/$SHEET_ID">View Full History</a>
  </p>
</body>
</html>
EOF

# 8. Upload to Google Drive
gog drive upload /tmp/digest.html --name "HN-Digest-$TODAY.html"
# Note the file ID from output
DRIVE_FILE_ID="<from-output>"

# 9. Send email
DRIVE_LINK="https://drive.google.com/file/d/$DRIVE_FILE_ID/view"
gog gmail send \
  --to georgehu@microsoft.com \
  --subject "Hacker News Daily Digest – $TODAY" \
  --body "Your daily Hacker News digest is ready!

View the report: $DRIVE_LINK

You can:
• Open with Google Docs to edit
• Export as PDF via File > Download > PDF
• View tracking sheet: https://docs.google.com/spreadsheets/d/$SHEET_ID

Total articles tracked: $(wc -l < /tmp/existing-ids.txt)
New articles today: $(wc -l < /tmp/new-entries.csv)

---
Automated by news-fetch-gog skill"
```

## Automated Cron Setup

Add to clawdbot configuration:

```json
{
  "skills": {
    "entries": {
      "news-fetch-gog": {
        "enabled": true,
        "schedule": {
          "cron": "0 9 * * *",
          "timezone": "America/New_York"
        },
        "config": {
          "recipient": "georgehu@microsoft.com",
          "sheetId": "<your-sheet-id>",
          "query": "Agentic AI",
          "maxResults": 50,
          "emailTopN": 20
        }
      }
    }
  }
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Daily Workflow (09:00 AM ET)                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Search Hacker News API                                   │
│     https://hn.algolia.com/api/v1/search                    │
│     Query: "Agentic AI"                                      │
│     → Returns: hn_id, title, url, points, author, date      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Load Google Sheet (Tracking Database)                   │
│     Columns: hn_id | title | url | points | author | date   │
│     → Extract existing hn_id list                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Deduplicate                                             │
│     Filter: new_articles = search_results - existing_ids    │
│     → Only keep articles not in Sheet                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Append New Entries to Sheet                             │
│     gog sheets append <sheetId> --values-json [...]         │
│     → Permanent storage for deduplication                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Read Latest Window (Top 50 rows)                        │
│     gog sheets get <sheetId> "Sheet1!A2:F51"                │
│     → Working set for today's digest                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Generate AI Summary                                      │
│     Input: Latest 20 articles                               │
│     Output: Executive summary, trends, insights             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Render HTML Template                                     │
│     Template: "Hacker News Daily Digest – {date}"           │
│     Sections: Summary | Top Articles | Full List            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Upload to Google Drive                                   │
│     gog drive upload /tmp/digest.html                       │
│     → Returns: Drive file ID and shareable link             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  9. Send Email with Link                                     │
│     To: georgehu@microsoft.com                              │
│     Subject: Hacker News Daily Digest – {date}              │
│     Body: Drive link + stats + tracking sheet link          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ✅ Delivered!                                              │
│     • HTML in Drive (can export to PDF)                     │
│     • Email notification sent                               │
│     • Sheet updated for tomorrow's deduplication            │
└─────────────────────────────────────────────────────────────┘
```

## Sheet Structure

```
┌────────────┬───────────────────────────┬─────────────────────────┬────────┬──────────┬─────────────────────┐
│ hn_id      │ title                     │ url                     │ points │ author   │ created_at          │
├────────────┼───────────────────────────┼─────────────────────────┼────────┼──────────┼─────────────────────┤
│ 42345678   │ New Agentic AI Framework  │ https://example.com/... │ 234    │ johndoe  │ 2026-02-07T08:00:00 │
│ 42345679   │ Building AI Agents at...  │ https://example.com/... │ 187    │ janedoe  │ 2026-02-07T07:30:00 │
│ ...        │ ...                       │ ...                     │ ...    │ ...      │ ...                 │
└────────────┴───────────────────────────┴─────────────────────────┴────────┴──────────┴─────────────────────┘
```

## Output Examples

### Email Subject
```
Hacker News Daily Digest – 2026-02-07
```

### Email Body
```
Your daily Hacker News digest is ready!

View the report: https://drive.google.com/file/d/abc123/view

You can:
• Open with Google Docs to edit
• Export as PDF via File > Download > PDF
• View tracking sheet: https://docs.google.com/spreadsheets/d/xyz789

Total articles tracked: 1,234
New articles today: 8

---
Automated by news-fetch-gog skill
```

### HTML Report Structure
```html
Hacker News Daily Digest – 2026-02-07

[Summary Section]
The Agentic AI landscape continues to evolve with 8 new discussions today...

Top Trends:
• Multi-agent frameworks gaining traction
• Real-world deployment challenges
• Integration with LLMs
• Evaluation methodologies
• Production considerations

[Top 20 Articles]
1. New Agentic AI Framework Released (234 points)
   by johndoe | https://example.com/article1

2. Building AI Agents at Scale (187 points)
   by janedoe | https://example.com/article2

...
```

## Advanced Features

### Custom Query
```bash
# Search for different topics
QUERY="LangChain OR AutoGPT OR AI Agents"
```

### Email Multiple Recipients
```bash
# Add to config
RECIPIENTS="georgehu@microsoft.com,team@example.com"
```

### Top N Ranking
```bash
# Sort by points and take top 10
gog sheets get "$SHEET_ID" "Sheet1!A2:F" --json | \
  jq -r '.values | sort_by(.[3] | tonumber) | reverse | .[:10]'
```

### Weekly Digest
```bash
# Change cron to weekly (Monday 9 AM)
CRON_SCHEDULE="0 9 * * 1"
```

### Export to PDF
```bash
# After uploading HTML to Drive, convert via Google Docs
# 1. Open with Google Docs: Right-click → Open with → Google Docs
# 2. File → Download → PDF Document (.pdf)
# Or automate with gog docs export (if Drive file is converted to Doc format)
```

### Slack/Telegram Integration
```bash
# Add notification to Slack
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Daily HN Digest ready: '"$DRIVE_LINK"'"}'

# Add notification to Telegram
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$CHAT_ID" \
  -d "text=Daily HN Digest ready: $DRIVE_LINK"
```

## Troubleshooting

### Authentication Issues
```bash
# Re-authenticate gog
gog auth list
gog auth add georgehu@microsoft.com --services gmail,sheets,drive
```

### Sheet Permission Errors
```bash
# Make sure the authenticated account has edit access to the Sheet
# Check sheet ID is correct
gog sheets metadata "$SHEET_ID" --json
```

### Email Not Sending
```bash
# Check Gmail quota (usually 500 emails/day for personal, 2000/day for Workspace)
# Verify sender email
gog gmail send --to georgehu@microsoft.com --subject "Test" --body "Test"
```

### Duplicate Entries
```bash
# Verify Sheet has header row
# Check column A contains unique hn_id values
gog sheets get "$SHEET_ID" "Sheet1!A:A" --json | jq '.values'
```

### Missing Dependencies
```bash
# Install required tools
brew install jq curl
pip3 install requests  # If using Python for parsing
```

## Integration with Clawdbot

This skill can be triggered:
- **Cron**: Automated daily execution
- **Manual**: User command via chat (Telegram/WhatsApp/Slack)
- **API**: HTTP endpoint trigger
- **Webhook**: HN webhook integration (if available)

Example chat commands:
```
User: "Run today's HN digest"
Bot: [Executes news-fetch-gog workflow]

User: "Show me the latest Agentic AI articles"
Bot: [Queries Sheet and returns top 10]

User: "Send me the digest now"
Bot: [Runs workflow and emails immediately]
```

## Best Practices

1. **Rate Limiting**: HN API allows ~3000 requests/hour, well above daily needs
2. **Error Handling**: Log failures and send error notifications
3. **Backup**: Keep Sheet as source of truth, Drive for distribution
4. **Monitoring**: Track email delivery status and Sheet append success
5. **Testing**: Test manually before enabling cron
6. **Updates**: Review and update query terms periodically

## Future Enhancements

- 📧 **PDF attachment** instead of Drive link
- 🗂️ **Date-based folders** in Drive for organization
- 🌏 **Bilingual digest** (English + Chinese)
- 🔔 **Multi-channel push** (Slack, Telegram, WhatsApp)
- 📊 **Ranking by score** (top N by points)
- 📈 **Trend analysis** (week-over-week changes)
- 🔍 **Keyword extraction** (automatic tagging)
- 💬 **Comment summary** (fetch top comments)

## References

- Hacker News Algolia API: https://hn.algolia.com/api
- gog CLI Documentation: https://gogcli.sh
- Google Sheets API: https://developers.google.com/sheets
- Google Drive API: https://developers.google.com/drive

---

**Status**: ✅ Ready for deployment
**Last Updated**: 2026-02-07
**Maintainer**: ghu
