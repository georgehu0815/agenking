# File Organizer Skill

Organize files in a directory by file type automatically.

## Installation

This skill is installed in your Clawdbot workspace at:
```
~/aiworker/clawdbot/skills/file-organizer/
```

Clawdbot will automatically discover it on next restart.

## Usage

### From Clawdbot Agent

Simply ask Clawdbot to organize files:

```bash
# Basic usage
pnpm clawdbot agent --message "Organize my Downloads folder"

# Custom folder
pnpm clawdbot agent --message "Organize files in ~/Documents"

# Dry run (preview only)
pnpm clawdbot agent --message "Show me what organizing my Desktop would look like"
```

### Direct CLI Usage

You can also call the skill directly:

```bash
# Organize Downloads
~/aiworker/clawdbot/skills/file-organizer/skill

# Organize custom folder
~/aiworker/clawdbot/skills/file-organizer/skill ~/Documents

# Dry run
~/aiworker/clawdbot/skills/file-organizer/skill ~/Downloads true
```

### JSON API

Pass parameters as JSON:

```bash
echo '{"folder": "~/Downloads", "dry_run": false}' | \
  ~/aiworker/clawdbot/skills/file-organizer/skill
```

## File Categories

The skill organizes files into these categories:

- **Presentations**: pptx, ppt, key, odp
- **Documents**: docx, doc, txt, md, rtf, odt
- **Spreadsheets**: xlsx, xls, csv, ods
- **PDFs**: pdf
- **Images**: jpg, jpeg, png, gif, bmp, svg, webp
- **Videos**: mp4, mov, avi, mkv, wmv, flv
- **Audio**: mp3, wav, m4a, flac, aac, ogg
- **Archives**: zip, rar, 7z, tar, gz, bz2
- **Code**: py, js, ts, html, css, json, xml, java, cpp, c, go, rs
- **Misc**: Everything else

## Safety Features

- ✅ **No overwrites**: Files with name collisions are skipped
- ✅ **Hidden files ignored**: Files starting with `.` or `~` are skipped
- ✅ **Directory preservation**: Existing subdirectories are left untouched
- ✅ **Dry run mode**: Preview changes before executing
- ✅ **Detailed reporting**: See exactly what was moved and skipped

## Output Format

The skill returns JSON with the operation results:

```json
{
  "moved": 142,
  "skipped": 3,
  "folder": "/Users/ghu/Downloads",
  "categories": {
    "Presentations": 36,
    "Documents": 53,
    "Spreadsheets": 19,
    "PDFs": 12,
    "Images": 15,
    "Videos": 4,
    "Code": 3,
    "Misc": 0
  }
}
```

## Examples

### Example 1: Organize Downloads

```bash
$ pnpm clawdbot agent --message "Organize my Downloads"
```

**Result**: All files in ~/Downloads are sorted into category folders.

### Example 2: Dry Run

```bash
$ pnpm clawdbot agent --message "Show what organizing ~/Desktop would do without making changes"
```

**Result**: Shows the plan without moving files.

### Example 3: Custom Folder

```bash
$ pnpm clawdbot agent --message "Organize files in /Users/ghu/Documents/project"
```

**Result**: Organizes files in the specified folder.

## Troubleshooting

### Skill not found

Restart Clawdbot gateway or check skill is in the correct location:
```bash
ls -la ~/aiworker/clawdbot/skills/file-organizer/
```

### Permission errors

Ensure scripts are executable:
```bash
chmod +x ~/aiworker/clawdbot/skills/file-organizer/skill
chmod +x ~/aiworker/clawdbot/skills/file-organizer/organize.sh
```

### Folder doesn't exist

Verify the folder path is correct and accessible.

## Customization

To add more file categories, edit `organize.sh` and add entries to the `EXTENSIONS` array:

```bash
["Ebooks"]="epub mobi azw3"
["3DModels"]="obj fbx stl blend"
```
