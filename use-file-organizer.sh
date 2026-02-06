#!/bin/bash
# Convenient wrapper to use the file-organizer skill

SKILL_DIR="$HOME/aiworker/clawdbot/skills/file-organizer"

show_help() {
  cat <<EOF
File Organizer - Organize files by type

Usage:
  $0 [folder] [--dry-run]

Arguments:
  folder     Path to organize (default: ~/Downloads)
  --dry-run  Show what would be done without making changes

Examples:
  $0                      # Organize ~/Downloads
  $0 ~/Documents          # Organize ~/Documents
  $0 ~/Desktop --dry-run  # Preview organization of ~/Desktop

Categories:
  - Presentations: pptx, ppt, key
  - Documents: docx, doc, txt, md
  - Spreadsheets: xlsx, xls, csv
  - PDFs: pdf
  - Images: jpg, png, gif
  - Videos: mp4, mov
  - Audio: mp3, wav
  - Archives: zip, rar, 7z
  - Code: py, js, html
  - Misc: everything else

Safety:
  ✓ No overwrites (skips files with name collisions)
  ✓ Ignores hidden files (starting with . or ~)
  ✓ Preserves existing directories
EOF
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  show_help
  exit 0
fi

FOLDER="${1:-$HOME/Downloads}"
DRY_RUN="false"

if [ "$2" = "--dry-run" ] || [ "$1" = "--dry-run" ]; then
  DRY_RUN="true"
  if [ "$1" = "--dry-run" ]; then
    FOLDER="$HOME/Downloads"
  fi
fi

echo "📁 File Organizer"
echo "Folder: $FOLDER"
if [ "$DRY_RUN" = "true" ]; then
  echo "Mode: DRY RUN (preview only)"
else
  echo "Mode: EXECUTE (will move files)"
fi
echo ""

# Run the skill
result=$("$SKILL_DIR/organize.sh" "$FOLDER" "$DRY_RUN")

# Check for errors
if echo "$result" | jq -e '.error' >/dev/null 2>&1; then
  echo "❌ Error: $(echo "$result" | jq -r '.error')"
  exit 1
fi

# Display results
moved=$(echo "$result" | jq -r '.moved')
skipped=$(echo "$result" | jq -r '.skipped')
would_move=$(echo "$result" | jq -r '.would_move // 0')

if [ "$DRY_RUN" = "true" ]; then
  echo "📊 Results (dry run):"
  echo "  Would move: $would_move files"
  echo "  Would skip: $skipped files (name collisions)"
else
  echo "📊 Results:"
  echo "  Moved: $moved files"
  echo "  Skipped: $skipped files (name collisions)"
fi

echo ""
echo "📂 Categories:"
echo "$result" | jq -r '.categories | to_entries[] | "  \(.key): \(.value) files"'

if [ "$DRY_RUN" = "true" ]; then
  echo ""
  echo "💡 To execute, run: $0 $FOLDER"
fi
