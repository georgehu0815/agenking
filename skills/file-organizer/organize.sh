#!/usr/bin/env bash
# File Organizer Skill Script
# Organizes files in a directory by type

set -eo pipefail

# Parse arguments
FOLDER="${1:-$HOME/Downloads}"
DRY_RUN="${2:-false}"
SKIP_TEMP="${3:-true}"

# Expand tilde and resolve path
FOLDER="${FOLDER/#\~/$HOME}"
if [ -d "$FOLDER" ]; then
  FOLDER="$(cd "$FOLDER" && pwd)"
fi

# Check if folder exists
if [ ! -d "$FOLDER" ]; then
  echo "{\"error\": \"Folder not found: $FOLDER\"}"
  exit 1
fi

# Function to get category for a file extension
get_category() {
  local ext="$1"
  ext="$(echo "$ext" | tr '[:upper:]' '[:lower:]')" # lowercase

  case "$ext" in
    ppt|pptx|key|odp)
      echo "Presentations" ;;
    doc|docx|txt|md|rtf|odt)
      echo "Documents" ;;
    xls|xlsx|csv|ods)
      echo "Spreadsheets" ;;
    pdf)
      echo "PDFs" ;;
    jpg|jpeg|png|gif|bmp|svg|webp)
      echo "Images" ;;
    mp4|mov|avi|mkv|wmv|flv)
      echo "Videos" ;;
    mp3|wav|m4a|flac|aac|ogg)
      echo "Audio" ;;
    zip|rar|7z|tar|gz|bz2)
      echo "Archives" ;;
    py|js|ts|html|css|json|xml|java|cpp|c|go|rs)
      echo "Code" ;;
    *)
      echo "Misc" ;;
  esac
}

# Initialize counters
moved=0
skipped=0
would_move=0

# Category counters (using a simple pattern)
cat_presentations=0
cat_documents=0
cat_spreadsheets=0
cat_pdfs=0
cat_images=0
cat_videos=0
cat_audio=0
cat_archives=0
cat_code=0
cat_misc=0

# Create category folders (unless dry run)
CATEGORIES="Presentations Documents Spreadsheets PDFs Images Videos Audio Archives Code Misc"
if [ "$DRY_RUN" != "true" ]; then
  for category in $CATEGORIES; do
    mkdir -p "$FOLDER/$category"
  done
fi

# Process files
shopt -s nullglob
for file in "$FOLDER"/*; do
  base="$(basename "$file")"

  # Skip directories
  [ -d "$file" ] && continue

  # Skip hidden files
  [[ "$base" == .* ]] && continue

  # Skip temp files if requested
  if [ "$SKIP_TEMP" = "true" ]; then
    [[ "$base" == ~* ]] && continue
  fi

  # Get extension and category
  ext="${base##*.}"
  category="$(get_category "$ext")"
  target="$FOLDER/$category/$base"

  if [ "$DRY_RUN" = "true" ]; then
    # Dry run - just count
    ((would_move++))
    case "$category" in
      Presentations) ((cat_presentations++)) ;;
      Documents) ((cat_documents++)) ;;
      Spreadsheets) ((cat_spreadsheets++)) ;;
      PDFs) ((cat_pdfs++)) ;;
      Images) ((cat_images++)) ;;
      Videos) ((cat_videos++)) ;;
      Audio) ((cat_audio++)) ;;
      Archives) ((cat_archives++)) ;;
      Code) ((cat_code++)) ;;
      Misc) ((cat_misc++)) ;;
    esac
  else
    # Actually move files
    if [ -e "$target" ]; then
      ((skipped++))
    else
      if mv "$file" "$target" 2>/dev/null; then
        ((moved++))
        case "$category" in
          Presentations) ((cat_presentations++)) ;;
          Documents) ((cat_documents++)) ;;
          Spreadsheets) ((cat_spreadsheets++)) ;;
          PDFs) ((cat_pdfs++)) ;;
          Images) ((cat_images++)) ;;
          Videos) ((cat_videos++)) ;;
          Audio) ((cat_audio++)) ;;
          Archives) ((cat_archives++)) ;;
          Code) ((cat_code++)) ;;
          Misc) ((cat_misc++)) ;;
        esac
      else
        ((skipped++))
      fi
    fi
  fi
done

# Build JSON output
cat <<EOF
{
  "moved": $moved,$([ "$DRY_RUN" = "true" ] && echo "
  \"would_move\": $would_move," || echo "")
  "skipped": $skipped,
  "folder": "$FOLDER",
  "categories": {
    "Presentations": $cat_presentations,
    "Documents": $cat_documents,
    "Spreadsheets": $cat_spreadsheets,
    "PDFs": $cat_pdfs,
    "Images": $cat_images,
    "Videos": $cat_videos,
    "Audio": $cat_audio,
    "Archives": $cat_archives,
    "Code": $cat_code,
    "Misc": $cat_misc
  }
}
EOF
