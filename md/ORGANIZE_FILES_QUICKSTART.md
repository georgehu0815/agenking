# Clawdbot File Organizer - Quick Start

> Organize your Downloads folder in 3 easy steps

## The 3-Step Process

### Step 1: See the Plan
```bash
cd ~/aiworker/clawdbot
./organize-files.sh ~/Downloads
```

**Output:** Shows folder structure and classification rules

### Step 2: Preview Files
```bash
./organize-files.sh ~/Downloads scan
```

**Output:** Shows which specific files go where

### Step 3: Execute
```bash
./organize-files.sh ~/Downloads execute
```

**Output:** Organizes files into folders by type

---

## What It Creates

```
Downloads/
├── Presentations/    (.pptx, .ppt, .key)
├── Documents/        (.docx, .doc, .txt, .md)
├── Spreadsheets/     (.xlsx, .xls, .csv)
├── PDFs/             (.pdf)
├── Images/           (.jpg, .png, .gif)
├── Videos/           (.mp4, .mov, .mkv)
├── Audio/            (.mp3, .wav, .m4a)
├── Archives/         (.zip, .rar, .7z)
├── Code/             (.py, .js, .html)
└── Misc/             (everything else)
```

---

## Safety Features

✅ **No Overwriting** - Skips files if name collision occurs
✅ **Confirmation Required** - Must type "yes" to execute
✅ **Preview Mode** - See changes before they happen
✅ **Error Reporting** - Lists any files that couldn't be moved

---

## Common Use Cases

### Organize Different Folders
```bash
./organize-files.sh ~/Documents
./organize-files.sh ~/Desktop
./organize-files.sh /path/to/any/folder
```

### Custom Organization
```bash
# Organize by year
./organize-files.sh ~/Downloads custom "Organize by year from filename"

# Separate work and personal
./organize-files.sh ~/Documents custom "Create Work and Personal folders based on keywords"

# Group by month
./organize-files.sh ~/Photos custom "Organize by month from EXIF data"
```

---

## Troubleshooting

### Script Not Found
```bash
chmod +x organize-files.sh
./organize-files.sh ~/Downloads
```

### Azure Warnings (Normal)
Ignore these messages - they're informational:
```
[Runtime] Initializing Azure OpenAI...
(node:xxx) [DEP0040] DeprecationWarning...
```

### Need More Time
```bash
CLAWDBOT_TIMEOUT=600 ./organize-files.sh ~/Downloads execute
```

---

## Full Documentation

For detailed guide, custom scenarios, and advanced usage:

📖 [CLAWDBOT_FILE_ORGANIZER_GUIDE.md](CLAWDBOT_FILE_ORGANIZER_GUIDE.md)

---

## Quick Reference

```bash
# Default - plan for Downloads
./organize-files.sh

# Organize specific folder
./organize-files.sh ~/Documents

# Detailed scan
./organize-files.sh ~/Downloads scan

# Execute
./organize-files.sh ~/Downloads execute

# Custom
./organize-files.sh ~/Downloads custom "your instructions"

# High thinking mode
CLAWDBOT_THINKING=high ./organize-files.sh ~/Downloads

# Longer timeout
CLAWDBOT_TIMEOUT=600 ./organize-files.sh ~/Downloads execute
```

---

**Ready to organize?** Start with: `./organize-files.sh ~/Downloads`
