# Clawdbot File Organizer - Complete Guide

> Organize your files intelligently using clawdbot AI agent with a simple script

## Overview

This guide shows you how to use clawdbot to automatically organize files in any folder (Downloads, Documents, etc.) by file type, with intelligent folder creation and safe file movement.

### What It Does

- **Analyzes** files in a folder
- **Creates** logical folder structure (Presentations, Documents, Images, etc.)
- **Moves** files to appropriate folders based on file type
- **Protects** against overwriting or data loss
- **Reports** what was done and any issues

---

## Quick Start

### 1. Basic Usage - Organize Downloads

```bash
# Step 1: See the plan (no changes made)
./organize-files.sh

# Step 2: See detailed file-by-file breakdown
./organize-files.sh ~/Downloads scan

# Step 3: Execute the organization
./organize-files.sh ~/Downloads execute
```

### 2. Organize Other Folders

```bash
# Organize Documents folder
./organize-files.sh ~/Documents

# Organize Desktop
./organize-files.sh ~/Desktop

# Organize any custom folder
./organize-files.sh /path/to/folder
```

---

## Installation

### Option 1: Use from Clawdbot Repository

```bash
cd ~/aiworker/clawdbot
./organize-files.sh ~/Downloads
```

### Option 2: Install Globally

```bash
# Copy to your local bin
cp ~/aiworker/clawdbot/organize-files.sh ~/.local/bin/organize-files
chmod +x ~/.local/bin/organize-files

# Use from anywhere
organize-files ~/Downloads
```

### Option 3: Add Alias

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias organize='~/aiworker/clawdbot/organize-files.sh'
```

Then use:
```bash
organize ~/Downloads
```

---

## Usage Modes

### Mode 1: Plan (Default)

Shows what will be done without making any changes.

```bash
./organize-files.sh ~/Downloads
# or
./organize-files.sh ~/Downloads plan
```

**Output:**
- Folder structure to be created
- File classification rules
- Safety measures

**Use Case:** First step to understand what will happen

---

### Mode 2: Scan

Detailed breakdown showing which specific files will go where.

```bash
./organize-files.sh ~/Downloads scan
```

**Output:**
- Lists 10-20+ example files
- Shows exact destination for each file
- Identifies edge cases

**Use Case:** Verify the plan with real file examples before executing

---

### Mode 3: Execute

Actually performs the file organization.

```bash
./organize-files.sh ~/Downloads execute
```

**Safety Features:**
- Confirmation prompt required
- No overwriting existing files
- Name collision detection
- Detailed error reporting

**Use Case:** Final step to organize files

---

### Mode 4: Custom

Send custom instructions to the agent.

```bash
./organize-files.sh ~/Downloads custom "Also create a 'Work' folder for files with 'project' in the name"

./organize-files.sh ~/Documents custom "Organize by year, extracting dates from filenames"

./organize-files.sh ~/Desktop custom "Group all images by month and create dated folders"
```

**Use Case:** Special organization requirements

---

## Complete Workflow Example

### Organizing Downloads Folder

```bash
# Current directory
cd ~/aiworker/clawdbot

# Step 1: Check current state
ls -la ~/Downloads | head -20

# Step 2: Get organization plan
./organize-files.sh ~/Downloads plan

# Review the output...
# ├── Presentations/
# ├── Documents/
# ├── Spreadsheets/
# ├── PDFs/
# etc.

# Step 3: See detailed scan
./organize-files.sh ~/Downloads scan

# Review specific files...
# "report.pdf" → PDFs/
# "presentation.pptx" → Presentations/
# "data.xlsx" → Spreadsheets/

# Step 4: Execute (with confirmation)
./organize-files.sh ~/Downloads execute
# ⚠️  This will MOVE files in /Users/ghu/Downloads
# ⚠️  Make sure you've reviewed the plan first!
# Are you sure you want to proceed? (yes/no): yes

# Step 5: Verify results
ls -la ~/Downloads
ls -la ~/Downloads/Presentations
ls -la ~/Downloads/Documents
```

---

## Advanced Usage

### Environment Variables

#### Set Thinking Level

Control how much the AI "thinks" before responding:

```bash
# Minimal thinking (faster)
CLAWDBOT_THINKING=minimal ./organize-files.sh ~/Downloads

# Medium thinking (balanced)
CLAWDBOT_THINKING=medium ./organize-files.sh ~/Downloads

# High thinking (more thorough)
CLAWDBOT_THINKING=high ./organize-files.sh ~/Downloads
```

Thinking levels:
- `off`: No extended thinking
- `minimal`: Brief analysis
- `low`: Light consideration
- `medium`: Moderate analysis (recommended)
- `high`: Deep analysis

#### Set Timeout

For folders with many files:

```bash
# Default timeout: 300 seconds (5 minutes)
CLAWDBOT_TIMEOUT=600 ./organize-files.sh ~/Downloads
```

### Combine Environment Variables

```bash
CLAWDBOT_THINKING=medium CLAWDBOT_TIMEOUT=600 ./organize-files.sh ~/Downloads execute
```

---

## Custom Organization Examples

### 1. Organize by Date

```bash
./organize-files.sh ~/Downloads custom "Organize files by year. Extract the year from filenames or file modification dates and create year folders (2023, 2024, 2025, etc.)"
```

### 2. Special File Categories

```bash
./organize-files.sh ~/Downloads custom "Create these folders: Work, Personal, Projects, Archive. Move files with 'project', 'meeting', or 'proposal' to Work. Move files with 'vacation', 'family' to Personal."
```

### 3. Clean Up Temp Files

```bash
./organize-files.sh ~/Downloads custom "Create a 'ToDelete' folder and move all files with 'temp', 'draft', 'copy', or 'untitled' in their names there"
```

### 4. Organize by Size

```bash
./organize-files.sh ~/Downloads custom "Create folders: Small (<1MB), Medium (1-50MB), Large (>50MB). Organize files by size."
```

### 5. Language-Specific Folders

```bash
./organize-files.sh ~/Downloads custom "Create 'English Documents' and 'Chinese Documents' folders. Move files based on whether filenames contain Chinese characters."
```

---

## Understanding the Script

### What Happens Behind the Scenes

```bash
./organize-files.sh ~/Downloads plan
```

Translates to:

```bash
pnpm clawdbot agent \
  --local \
  --session-id file-organizer-1738444800 \
  --message "Organize the files in /Users/ghu/Downloads..."
```

### Session IDs

Each run creates a unique session ID based on timestamp:
- `file-organizer-1738444800`
- `file-organizer-1738444805`

This allows you to:
- Track different organization sessions
- Review session history
- Continue interrupted sessions

---

## Safety Features

### 1. No Overwriting

If a file with the same name already exists in the destination folder:
- The file is **skipped**
- A warning is reported
- Original file remains untouched

### 2. Confirmation Required

For `execute` mode, you must type "yes" to confirm:

```bash
./organize-files.sh ~/Downloads execute
# ⚠️  This will MOVE files in /Users/ghu/Downloads
# ⚠️  Make sure you've reviewed the plan first!
# Are you sure you want to proceed? (yes/no):
```

### 3. Hidden Files Ignored

System files are not touched:
- `.DS_Store`
- `.localized`
- Other dot files

### 4. Error Reporting

Any issues are reported:
- Permission errors
- Name collisions
- Move failures

---

## Troubleshooting

### Issue: "Command not found"

**Cause:** Script not executable or not in PATH

**Fix:**
```bash
chmod +x organize-files.sh
./organize-files.sh ~/Downloads
```

Or use full path:
```bash
bash ~/aiworker/clawdbot/organize-files.sh ~/Downloads
```

---

### Issue: "Folder does not exist"

**Cause:** Invalid folder path

**Fix:** Use absolute path or verify folder exists:
```bash
ls -la ~/Downloads
./organize-files.sh ~/Downloads
```

---

### Issue: Azure Authentication Warnings

**Output:**
```
[Runtime] Initializing Azure OpenAI with managed identity
ENV : undefined  Using AzureCliCredential
(node:19488) [DEP0040] DeprecationWarning: The `punycode` module is deprecated
```

**Status:** Normal - these are informational warnings

**Action:** None needed - the script works correctly despite these warnings

---

### Issue: "Error: Pass --to <E.164>, --session-id, or --agent"

**Cause:** Trying to use clawdbot agent without session ID

**Fix:** Use the script, which automatically handles session IDs:
```bash
./organize-files.sh ~/Downloads
```

Or manually specify session ID:
```bash
pnpm clawdbot agent --local --session-id my-session --message "..."
```

---

### Issue: Agent Times Out

**Cause:** Folder has too many files, exceeds default 5-minute timeout

**Fix:** Increase timeout:
```bash
CLAWDBOT_TIMEOUT=900 ./organize-files.sh ~/Downloads execute
```

---

### Issue: Some Files Not Organized

**Possible Causes:**
1. File type not recognized
2. Name collision
3. Permission error

**Fix:**

Check the agent's report at the end of execution for details:
```bash
# Run scan to see which files will be organized
./organize-files.sh ~/Downloads scan

# Then execute and check output
./organize-files.sh ~/Downloads execute
```

Files that couldn't be organized will be reported with reasons.

---

## Tips and Best Practices

### 1. Always Start with Plan

```bash
# GOOD: Review first
./organize-files.sh ~/Downloads plan
./organize-files.sh ~/Downloads execute

# RISKY: Direct execution
./organize-files.sh ~/Downloads execute  # ⚠️ No review
```

### 2. Use Scan for Large Folders

For folders with 100+ files:
```bash
./organize-files.sh ~/Downloads scan
```

This shows you exactly what will happen before executing.

### 3. Backup Important Folders

Before organizing critical folders:
```bash
# Create backup
cp -r ~/Documents ~/Documents.backup

# Then organize
./organize-files.sh ~/Documents execute

# Verify results, then remove backup
rm -rf ~/Documents.backup
```

### 4. Organize Regularly

Set up a monthly reminder:
```bash
# Add to crontab (first Monday of each month)
0 9 1-7 * 1 ~/aiworker/clawdbot/organize-files.sh ~/Downloads execute
```

### 5. Custom Categories per Folder

Different folders need different organization:

```bash
# Downloads: by file type (default)
./organize-files.sh ~/Downloads execute

# Documents: by year
./organize-files.sh ~/Documents custom "Organize by year"

# Desktop: by project
./organize-files.sh ~/Desktop custom "Create folders: Active, Archive, Personal"
```

---

## Integration with Other Tools

### 1. Add to Shell Aliases

**~/.bashrc or ~/.zshrc:**
```bash
# Quick aliases
alias org='~/aiworker/clawdbot/organize-files.sh'
alias org-dl='~/aiworker/clawdbot/organize-files.sh ~/Downloads'
alias org-docs='~/aiworker/clawdbot/organize-files.sh ~/Documents'

# Scan aliases
alias scan-dl='~/aiworker/clawdbot/organize-files.sh ~/Downloads scan'
```

**Usage:**
```bash
org-dl                    # Plan for Downloads
scan-dl                   # Scan Downloads
org-dl execute            # Execute organization
```

### 2. Create Desktop Shortcut (macOS)

Create `~/Desktop/Organize Downloads.command`:

```bash
#!/bin/bash
cd ~/aiworker/clawdbot
./organize-files.sh ~/Downloads execute
```

Make executable:
```bash
chmod +x ~/Desktop/Organize\ Downloads.command
```

Double-click to organize Downloads.

### 3. Add to Finder Quick Actions (macOS)

Use Automator to create a Quick Action:
1. Open Automator
2. New → Quick Action
3. Add "Run Shell Script"
4. Paste:
   ```bash
   ~/aiworker/clawdbot/organize-files.sh "$@" plan
   ```
5. Save as "Organize with Clawdbot"

Right-click any folder → Quick Actions → Organize with Clawdbot

---

## Comparing to Manual Organization

### Manual Organization
```bash
# Create folders
mkdir ~/Downloads/Presentations
mkdir ~/Downloads/Documents
mkdir ~/Downloads/PDFs

# Move files manually
mv ~/Downloads/*.pptx ~/Downloads/Presentations/
mv ~/Downloads/*.docx ~/Downloads/Documents/
mv ~/Downloads/*.pdf ~/Downloads/PDFs/

# Handle edge cases manually
# ... (tedious!)
```

**Time:** 10-30 minutes
**Error-Prone:** Yes
**Customizable:** Limited

### Clawdbot Organization
```bash
./organize-files.sh ~/Downloads execute
```

**Time:** 1-2 minutes
**Error-Prone:** No
**Customizable:** Very (via custom mode)
**Safety:** Built-in (no overwrites, collision detection)

---

## FAQ

### Q: Will this delete any files?

**A:** No. The script only **moves** files to subfolders within the same parent folder. No files are deleted.

### Q: What if two files have the same name?

**A:** The second file is **skipped** and reported. No overwriting occurs. You'll need to manually handle duplicates.

### Q: Can I undo the organization?

**A:** Yes, but not automatically. You'll need to manually move files back or restore from a backup. Best practice: review the plan and scan before executing.

### Q: Does this work with network drives?

**A:** Yes, as long as the clawdbot agent has read/write permissions to the folder.

### Q: Can I organize multiple folders at once?

**A:** Not in one command. Run the script separately for each folder:
```bash
./organize-files.sh ~/Downloads execute
./organize-files.sh ~/Documents execute
./organize-files.sh ~/Desktop execute
```

### Q: What file types are supported?

**A:** All common file types:
- **Documents:** .docx, .pdf, .txt, .md, .pages
- **Spreadsheets:** .xlsx, .csv, .numbers
- **Presentations:** .pptx, .key
- **Images:** .jpg, .png, .gif, .heic
- **Videos:** .mp4, .mov, .mkv
- **Audio:** .mp3, .wav, .m4a
- **Archives:** .zip, .rar, .7z
- **Code:** .py, .js, .html, .css
- **And more...**

### Q: Can I exclude certain files or folders?

**A:** Yes, use custom mode:
```bash
./organize-files.sh ~/Downloads custom "Organize files but skip anything in 'Important' or 'Projects' folders"
```

### Q: How long does it take?

**A:**
- **Planning:** 5-10 seconds
- **Scanning:** 10-30 seconds (depending on file count)
- **Executing:** 30-120 seconds (depending on file count)

---

## Real-World Use Cases

### Use Case 1: Clean Up Messy Downloads

**Before:**
```
Downloads/
├── IMG_1234.jpg
├── IMG_5678.png
├── report-final-v2.pdf
├── presentation.pptx
├── data.xlsx
├── random-file.txt
└── ... (200+ files)
```

**After:**
```
Downloads/
├── Images/
│   ├── IMG_1234.jpg
│   └── IMG_5678.png
├── PDFs/
│   └── report-final-v2.pdf
├── Presentations/
│   └── presentation.pptx
├── Spreadsheets/
│   └── data.xlsx
└── Documents/
    └── random-file.txt
```

**Commands:**
```bash
./organize-files.sh ~/Downloads plan
./organize-files.sh ~/Downloads execute
```

---

### Use Case 2: Organize Work Documents by Year

**Command:**
```bash
./organize-files.sh ~/Documents custom "Organize work documents by year. Create folders: 2023, 2024, 2025. Extract year from filename or modification date."
```

**Result:**
```
Documents/
├── 2023/
│   ├── Q1-Report.pdf
│   └── Annual-Budget-2023.xlsx
├── 2024/
│   ├── Project-Plan-2024.docx
│   └── Meeting-Notes-Jan-2024.pdf
└── 2025/
    ├── Strategy-2025.pptx
    └── Goals-2025.docx
```

---

### Use Case 3: Separate Personal and Work Files

**Command:**
```bash
./organize-files.sh ~/Desktop custom "Create 'Work' and 'Personal' folders. Move files with keywords like 'meeting', 'project', 'report', 'proposal' to Work. Move files with 'vacation', 'family', 'recipe', 'photo' to Personal. Everything else to 'Misc'."
```

**Result:**
```
Desktop/
├── Work/
│   ├── Meeting-Notes.pdf
│   ├── Project-Proposal.docx
│   └── Weekly-Report.xlsx
├── Personal/
│   ├── Vacation-Photos.zip
│   ├── Family-Recipe.pdf
│   └── Birthday-Invite.jpg
└── Misc/
    └── random-file.txt
```

---

## Script Reference

### Command Syntax

```bash
./organize-files.sh [folder] [mode] ["custom message"]
```

### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| folder | No | ~/Downloads | Path to organize |
| mode | No | plan | Operation mode (plan/scan/execute/custom) |
| message | Custom mode only | - | Custom instruction |

### Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| CLAWDBOT_THINKING | off, minimal, low, medium, high | (system default) | AI thinking level |
| CLAWDBOT_TIMEOUT | Number (seconds) | 300 | Command timeout |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (folder not found, invalid mode, user cancelled, etc.) |

---

## Related Documentation

- **Clawdbot CLI Docs:** https://docs.clawd.bot/cli/agent
- **Azure OpenAI Setup:** [AZURE_OPENAI_IMAGE_SETUP.md](AZURE_OPENAI_IMAGE_SETUP.md)
- **Vector DB Setup:** [VECTOR_DB_COMPLETE_GUIDE.md](VECTOR_DB_COMPLETE_GUIDE.md)
- **Node.js Setup:** [NODE_GLOBAL_VERSION_SETUP.md](NODE_GLOBAL_VERSION_SETUP.md)

---

## Summary

### ✅ What You Can Do

```
File Organization Made Easy! 🎉

┌─────────────────────────────────────────┐
│ Clawdbot File Organizer                 │
├─────────────────────────────────────────┤
│ ✅ Organize any folder by file type     │
│ ✅ Custom organization rules            │
│ ✅ Safe execution (no overwrites)       │
│ ✅ Detailed preview before changes      │
│ ✅ Smart file classification            │
│ ✅ Handles edge cases automatically     │
└─────────────────────────────────────────┘

Quick Start:
  1. ./organize-files.sh ~/Downloads plan
  2. ./organize-files.sh ~/Downloads scan
  3. ./organize-files.sh ~/Downloads execute

Advanced:
  ./organize-files.sh ~/Downloads custom "Your instructions"
```

### Quick Reference Card

**Common Commands:**
```bash
# Default (plan for Downloads)
./organize-files.sh

# Organize specific folder
./organize-files.sh ~/Documents

# Detailed scan
./organize-files.sh ~/Downloads scan

# Execute organization
./organize-files.sh ~/Downloads execute

# Custom organization
./organize-files.sh ~/Downloads custom "Organize by date"

# With high thinking
CLAWDBOT_THINKING=high ./organize-files.sh ~/Downloads
```

---

**Last Updated**: 2026-02-01
**Script Version**: 1.0
**Clawdbot Version**: 2026.1.25
**Author**: Generated with Claude

---

## Feedback and Issues

If you encounter any issues or have suggestions:
1. Check the Troubleshooting section above
2. Review the clawdbot logs
3. Open an issue: https://github.com/clawdbot/clawdbot/issues

Happy organizing! 🗂️
