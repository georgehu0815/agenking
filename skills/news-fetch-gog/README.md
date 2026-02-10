# news-fetch-gog 📰

Automated Hacker News daily digest workflow with Google Workspace integration.

## Quick Start

### 1. Prerequisites

```bash
# Install gog CLI
brew install steipete/tap/gogcli

# Install dependencies
brew install jq

# Authenticate with Google
gog auth add georgehu@microsoft.com --services gmail,sheets,drive
```

### 2. Create Tracking Sheet

```bash
# Create a new Google Sheet
gog sheets create "HN-Agentic-AI-Tracker"
# Note the Sheet ID from the output (format: 1abc...xyz)

# Add header row
SHEET_ID="<your-sheet-id>"
gog sheets update "$SHEET_ID" "Sheet1!A1:F1" \
  --values-json '[["hn_id","title","url","points","author","created_at"]]' \
  --input USER_ENTERED
```

### 3. Run Digest

```bash
# Set configuration
export SHEET_ID="<your-sheet-id>"
export RECIPIENT_EMAIL="georgehu@microsoft.com"

# Run the workflow
./run-digest.sh
```

## What It Does

```
Search HN → Deduplicate → Append to Sheet → Generate Summary → Create HTML → Upload to Drive → Email Report
```

### Daily Workflow

1. 🔍 **Search** Hacker News for "Agentic AI" topics
2. 🧮 **Deduplicate** against Google Sheet by `hn_id`
3. ➕ **Append** new articles to Sheet
4. 📖 **Read** latest 50 articles
5. ✍️ **Generate** AI summary
6. 🧾 **Render** HTML digest
7. ☁️ **Upload** to Google Drive
8. ✉️ **Email** digest with Drive link

## Configuration

Environment variables:

```bash
RECIPIENT_EMAIL="georgehu@microsoft.com"  # Email recipient
SHEET_ID="<sheet-id>"                     # Google Sheet ID
HN_QUERY="Agentic AI"                     # Search query
MAX_RESULTS="50"                          # Max articles to fetch
EMAIL_TOP_N="20"                          # Top N in email digest
TIMEZONE="America/New_York"               # Timezone for dates
```

## Automated Scheduling

### Option 1: System Cron

```bash
# Edit crontab
crontab -e

# Add daily job at 9 AM ET
0 9 * * * export SHEET_ID="<sheet-id>" && /path/to/news-fetch-gog/run-digest.sh >> /tmp/news-fetch-gog.log 2>&1
```

### Option 2: Clawdbot Skill

Add to `~/.clawdbot/clawdbot.json`:

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
          "query": "Agentic AI"
        }
      }
    }
  }
}
```

## Output

### Email
Subject: `Hacker News Daily Digest – 2026-02-07`

Body:
- Drive link to HTML report
- Statistics (total tracked, new today)
- Links to tracking Sheet
- Conversion instructions (HTML → PDF)

### HTML Report
- Summary section with key insights
- Top 20 articles with titles, points, links
- Styled with HN orange theme
- Responsive design

### Google Sheet
Permanent storage with columns:
- `hn_id`: Unique HN article ID
- `title`: Article title
- `url`: Article URL
- `points`: HN points (score)
- `author`: HN username
- `created_at`: Publication timestamp

## Usage Examples

### Run Now
```bash
./run-digest.sh
```

### Custom Query
```bash
HN_QUERY="LangChain OR AutoGPT" ./run-digest.sh
```

### Different Recipient
```bash
RECIPIENT_EMAIL="team@example.com" ./run-digest.sh
```

### Test Without Email
```bash
# Comment out email sending in script, or modify to skip Step 9
```

## Troubleshooting

### "gog CLI not found"
```bash
brew install steipete/tap/gogcli
```

### "Sheet not accessible"
```bash
# Verify Sheet ID
gog sheets metadata "$SHEET_ID" --json

# Check authentication
gog auth list
```

### "Email not sending"
```bash
# Test email manually
gog gmail send --to georgehu@microsoft.com --subject "Test" --body "Test"
```

### "No new articles"
This is normal if HN has no new "Agentic AI" discussions since last run.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Hacker News Algolia API                    │
│  https://hn.algolia.com/api/v1/search       │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ (fetch via curl)
┌─────────────────────────────────────────────┐
│  run-digest.sh (Bash Script)                │
│  • Parse HN results                         │
│  • Deduplicate against Sheet                │
│  • Generate HTML report                     │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ (via gog CLI)
┌─────────────────────────────────────────────┐
│  Google Workspace                           │
│  • Sheets: Tracking database                │
│  • Drive: HTML report storage               │
│  • Gmail: Email delivery                    │
└─────────────────────────────────────────────┘
```

## Files

```
news-fetch-gog/
├── SKILL.md           # Full documentation
├── README.md          # This file (quick start)
├── run-digest.sh      # Main workflow script
└── examples/          # Example outputs (future)
```

## Future Enhancements

- [ ] PDF attachment (instead of Drive link)
- [ ] Multi-language support (English + Chinese)
- [ ] Slack/Telegram notifications
- [ ] Top N ranking by score
- [ ] Weekly/monthly digest modes
- [ ] Comment summary integration
- [ ] Trend analysis over time
- [ ] Keyword extraction and tagging

## References

- [Hacker News Algolia API](https://hn.algolia.com/api)
- [gog CLI Documentation](https://gogcli.sh)
- [SKILL.md](./SKILL.md) - Full documentation

---

**Status**: ✅ Ready to use
**Version**: 1.0.0
**Last Updated**: 2026-02-07
