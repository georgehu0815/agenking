#!/usr/bin/env bash
#
# news-fetch-gog Configuration Example
# Copy this file to config.sh and customize for your setup
#

# Email recipient (required)
export RECIPIENT_EMAIL="georgehu@microsoft.com"

# Google Sheet ID (required)
# Get this after creating the tracking sheet with:
#   gog sheets create "HN-Agentic-AI-Tracker"
export SHEET_ID="YOUR_SHEET_ID_HERE"

# Hacker News search query (optional, default: "Agentic AI")
export HN_QUERY="Agentic AI"

# Maximum results to fetch from HN API (optional, default: 50)
export MAX_RESULTS="50"

# Top N articles to include in email digest (optional, default: 20)
export EMAIL_TOP_N="20"

# Timezone for date formatting (optional, default: "America/New_York")
export TIMEZONE="America/New_York"

# Optional: Additional recipients (comma-separated)
# export CC_RECIPIENTS="team@example.com,another@example.com"

# Optional: Custom Drive folder ID (upload to specific folder)
# export DRIVE_FOLDER_ID="folder-id-here"

# Optional: Subject line prefix
# export EMAIL_SUBJECT_PREFIX="[Daily Digest]"
