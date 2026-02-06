#!/bin/bash
# Direct file organization without agent - just bash

DOWNLOADS="$HOME/Downloads"

echo "Creating organization folders..."
mkdir -p "$DOWNLOADS"/{Presentations,Documents,Spreadsheets,PDFs,Images,Videos,Audio,Archives,Code,Misc}

echo "Moving files..."
moved=0
skipped=0

# Move presentations
for ext in ppt pptx key; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    [[ "$base" == ~* ]] && continue  # Skip temp files
    target="$DOWNLOADS/Presentations/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Presentations/" && ((moved++))
    fi
  done
done

# Move documents
for ext in doc docx txt md; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    [[ "$base" == ~* ]] && continue
    target="$DOWNLOADS/Documents/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Documents/" && ((moved++))
    fi
  done
done

# Move PDFs
for file in "$DOWNLOADS"/*.pdf; do
  [ -f "$file" ] || continue
  base="$(basename "$file")"
  target="$DOWNLOADS/PDFs/$base"
  if [ -e "$target" ]; then
    echo "Skipped (exists): $base"
    ((skipped++))
  else
    mv "$file" "$target" && echo "Moved: $base → PDFs/" && ((moved++))
  fi
done

# Move spreadsheets
for ext in xls xlsx csv; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    [[ "$base" == ~* ]] && continue
    target="$DOWNLOADS/Spreadsheets/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Spreadsheets/" && ((moved++))
    fi
  done
done

# Move images
for ext in jpg jpeg png gif bmp; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    target="$DOWNLOADS/Images/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Images/" && ((moved++))
    fi
  done
done

# Move videos
for ext in mp4 mov avi mkv; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    target="$DOWNLOADS/Videos/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Videos/" && ((moved++))
    fi
  done
done

# Move audio
for ext in mp3 wav m4a flac; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    target="$DOWNLOADS/Audio/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Audio/" && ((moved++))
    fi
  done
done

# Move archives
for ext in zip rar 7z tar gz; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    target="$DOWNLOADS/Archives/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Archives/" && ((moved++))
    fi
  done
done

# Move code
for ext in py js html css json xml; do
  for file in "$DOWNLOADS"/*.$ext; do
    [ -f "$file" ] || continue
    base="$(basename "$file")"
    target="$DOWNLOADS/Code/$base"
    if [ -e "$target" ]; then
      echo "Skipped (exists): $base"
      ((skipped++))
    else
      mv "$file" "$target" && echo "Moved: $base → Code/" && ((moved++))
    fi
  done
done

echo ""
echo "=========================================="
echo "✅ Organization complete!"
echo "Moved: $moved files"
echo "Skipped: $skipped files (name collisions)"
echo "=========================================="
echo ""
echo "Check results:"
for dir in Presentations Documents Spreadsheets PDFs Images Videos Audio Archives Code Misc; do
  count=$(ls "$DOWNLOADS/$dir" 2>/dev/null | wc -l | tr -d ' ')
  echo "  $dir: $count files"
done
