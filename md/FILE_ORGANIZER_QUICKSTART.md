# File Organizer Skill - Quick Start Guide

The **file-organizer** skill is now installed and ready to use! It organizes files by type into category folders.

## ✅ Installation Complete

- **Skill Location:** [~/aiworker/clawdbot/skills/file-organizer/](skills/file-organizer/)
- **Status:** ✓ Ready (registered with Clawdbot)
- **Quick Script:** [use-file-organizer.sh](use-file-organizer.sh)

## 🚀 Usage Methods

### Method 1: Direct Script (Easiest)

```bash
# Organize Downloads
~/aiworker/clawdbot/use-file-organizer.sh

# Organize custom folder
~/aiworker/clawdbot/use-file-organizer.sh ~/Documents

# Preview without changes (dry run)
~/aiworker/clawdbot/use-file-organizer.sh ~/Desktop --dry-run
```

### Method 2: Call Skill Directly

```bash
# Using the skill entrypoint
~/aiworker/clawdbot/skills/file-organizer/skill ~/Downloads false

# Dry run
~/aiworker/clawdbot/skills/file-organizer/skill ~/Documents true
```

### Method 3: Through Clawdbot Agent

**Note:** Azure OpenAI content filters may block certain phrasing. Use gentle language:

```bash
# Works well
pnpm clawdbot agent --session-id test-file-org2-$(date +%s)  --message "Please organize my Downloads folder"

pnpm clawdbot agent --local --session-id test-file-org2-$(date +%s) --message "Use the file-organizer skill NOW to organize /tmp/test-organize2. Use defaults. Execute immediately without asking for confirmation."


# May trigger content filter (avoid)
pnpm clawdbot agent --message "Execute NOW and organize files"
```

**Alternative:** The agent may ask for confirmation before organizing. This is expected behavior. You can respond "yes, use defaults" to proceed.

## 📂 File Categories

The skill organizes files into these folders:

| Folder | Extensions |
|--------|-----------|
| **Presentations** | pptx, ppt, key, odp |
| **Documents** | docx, doc, txt, md, rtf, odt |
| **Spreadsheets** | xlsx, xls, csv, ods |
| **PDFs** | pdf |
| **Images** | jpg, jpeg, png, gif, bmp, svg, webp |
| **Videos** | mp4, mov, avi, mkv, wmv, flv |
| **Audio** | mp3, wav, m4a, flac, aac, ogg |
| **Archives** | zip, rar, 7z, tar, gz, bz2 |
| **Code** | py, js, ts, html, css, json, xml, java, cpp, c, go, rs |
| **Misc** | Everything else |

## 🛡️ Safety Features

- ✅ **No overwrites**: Skips files with name collisions
- ✅ **Hidden files ignored**: Files starting with `.` or `~` are skipped
- ✅ **Directory preservation**: Existing subdirectories remain untouched
- ✅ **Dry run mode**: Preview changes before executing
- ✅ **JSON output**: Detailed reporting of moved/skipped files

## 💡 Examples

### Example 1: Organize Downloads

```bash
$ ~/aiworker/clawdbot/use-file-organizer.sh

📁 File Organizer
Folder: /Users/ghu/Downloads
Mode: EXECUTE (will move files)

📊 Results:
  Moved: 116 files
  Skipped: 3 files (name collisions)

📂 Categories:
  Presentations: 36 files
  Documents: 53 files
  Spreadsheets: 19 files
  PDFs: 1 files
  Images: 3 files
  Videos: 2 files
  Code: 2 files
```

### Example 2: Preview Changes (Dry Run)

```bash
$ ~/aiworker/clawdbot/use-file-organizer.sh ~/Documents --dry-run

📁 File Organizer
Folder: /Users/ghu/Documents
Mode: DRY RUN (preview only)

📊 Results (dry run):
  Would move: 87 files
  Would skip: 2 files (name collisions)

📂 Categories:
  Presentations: 12 files
  Documents: 45 files
  Spreadsheets: 8 files
  PDFs: 20 files
  Images: 2 files

💡 To execute, run: /Users/ghu/aiworker/clawdbot/use-file-organizer.sh ~/Documents
```

### Example 3: Through Clawdbot Agent

```bash
$ pnpm clawdbot agent --message "Please organize my Downloads folder with the file-organizer skill"

# Agent will either:
# - Execute the skill directly, or
# - Ask for confirmation (reply "yes, use defaults")
```

## 🔧 Customization

To add more file categories or extensions, edit:
```
~/aiworker/clawdbot/skills/file-organizer/organize.sh
```

Add new cases to the `get_category()` function:

```bash
case "$ext" in
  # ... existing cases ...
  epub|mobi|azw3)
    echo "Ebooks" ;;
  obj|fbx|stl|blend)
    echo "3DModels" ;;
  *)
    echo "Misc" ;;
esac
```

## 📚 Documentation

- **Skill Documentation:** [skills/file-organizer/SKILL.md](skills/file-organizer/SKILL.md)
- **README:** [skills/file-organizer/README.md](skills/file-organizer/README.md)
- **Source Code:** [skills/file-organizer/organize.sh](skills/file-organizer/organize.sh)

## 🐛 Troubleshooting

### Skill not found in Clawdbot

Check skill is registered:
```bash
pnpm clawdbot skills list | grep file-organizer
```

Should show:
```
│ ✓ ready   │ 📦 file-organizer │ Organize files in a directory by file type...
```

### Permission errors

Ensure scripts are executable:
```bash
chmod +x ~/aiworker/clawdbot/skills/file-organizer/skill
chmod +x ~/aiworker/clawdbot/skills/file-organizer/organize.sh
chmod +x ~/aiworker/clawdbot/use-file-organizer.sh
```

### Agent asks for confirmation repeatedly

This is expected behavior. The agent is being cautious. You can:
1. Use the direct script instead ([use-file-organizer.sh](use-file-organizer.sh))
2. Respond "yes, use defaults" when the agent asks
3. Use phrases like "please" instead of "now" to avoid content filters

### Content filter errors (Azure OpenAI)

Avoid urgent language like "NOW", "immediately", "execute". Use gentler phrases:
- ✅ "Please organize my files"
- ✅ "Help me organize Downloads"
- ❌ "Execute NOW and organize files"

## 🎉 Success!

Your file-organizer skill is installed and working! Use [use-file-organizer.sh](use-file-organizer.sh) for the easiest experience.

**Quick command:**
```bash
~/aiworker/clawdbot/use-file-organizer.sh
```

Happy organizing! 📁✨
