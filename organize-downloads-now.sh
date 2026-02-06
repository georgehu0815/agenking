#!/bin/bash
# Quick script to organize Downloads without interactive prompts

SESSION_ID="organize-$(date +%s)"

echo "🔄 Organizing ~/Downloads..."
echo ""

pnpm clawdbot agent --local --session-id "$SESSION_ID" \
  --message "Organize files in ~/Downloads folder by file type. Create these folders: Presentations (pptx/ppt/key), Documents (docx/doc/txt/md), Spreadsheets (xlsx/xls/csv), PDFs (pdf), Images (jpg/png/gif), Videos (mp4/mov), Audio (mp3/wav), Archives (zip/rar/7z), Code (py/js/html), Misc (others). EXECUTE THIS NOW - do not ask for confirmation, I am confirming now. Move files immediately and report results. Safety: skip files with name collisions, do not overwrite. Ignore hidden files starting with dot or tilde (~)."

echo ""
echo "✅ Done! Check results:"
echo "   ls ~/Downloads/"
