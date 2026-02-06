---
name: file-organizer
description: Organize files in a directory by file type (presentations, documents, spreadsheets, PDFs, images, videos, etc.). Use when the user asks to organize, sort, or clean up files in a folder.
user-invocable: true
disable-model-invocation: false
---

# File Organizer

You are a specialized skill for organizing files in directories by their file types.

## When to Use This Skill

Invoke this skill when the user:
- Asks to organize files in a folder
- Wants to clean up their Downloads folder
- Requests sorting files by type
- Mentions tidying up or organizing a directory
- Wants files grouped into categories
- Asks to "organize my files" or "sort my Downloads"

## Triggers:
- "Organize my Downloads folder"
- "Sort files in ~/Documents by type"
- "Clean up my Desktop"
- "Organize files by extension"
- "Group my files by type"
- "Tidy up my Downloads"
- "Categorize files in this folder"

## Capabilities

This skill organizes files by creating category folders and moving files into them:

### File Categories
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

## How This Skill Works

1. **Target Folder**: Accepts a folder path (default: ~/Downloads)
2. **Create Categories**: Creates subdirectories for each file type
3. **Move Files**: Moves files into appropriate category folders
4. **Safety**:
   - Skips files with name collisions (no overwrites)
   - Ignores hidden files (starting with . or ~)
   - Ignores existing directories
5. **Report**: Returns statistics on moved/skipped files

## Usage

### Required Input
- **folder** (string): The path to the folder to organize (default: ~/Downloads)

### Optional Input
- **dry_run** (boolean): If true, shows what would be done without actually moving files (default: false)
- **skip_temp_files** (boolean): If true, skips temporary files like ~$* (default: true)

### Expected Output

Returns an object containing:
- **moved** (integer): Number of files successfully moved
- **skipped** (integer): Number of files skipped due to name collisions
- **categories** (object): Count of files in each category folder
- **folder** (string): The folder that was organized

### Example Interactions

#### Example 1: Organize Downloads

**User**: "Organize my Downloads folder"

**You should**:
1. Invoke this skill with `folder: "~/Downloads"`
2. Present the results to the user

**Expected Result**:
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

#### Example 2: Dry Run

**User**: "Show me what organizing my Documents would look like"

**You should**:
1. Invoke this skill with `folder: "~/Documents"` and `dry_run: true`
2. Present the plan to the user

**Expected Result**:
```json
{
  "moved": 0,
  "would_move": 87,
  "skipped": 2,
  "folder": "/Users/ghu/Documents",
  "categories": {
    "Presentations": 12,
    "Documents": 45,
    "Spreadsheets": 8,
    "PDFs": 20,
    "Images": 2
  }
}
```

#### Example 3: Organize Custom Folder

**User**: "Organize the files in /Users/ghu/Desktop/project"

**You should**:
1. Invoke this skill with `folder: "/Users/ghu/Desktop/project"`
2. Present the results

## Configuration

No configuration needed. The skill works out of the box.

## Error Handling

If the skill fails, check:

1. **Folder Doesn't Exist**: Ensure the folder path is valid
2. **Permission Issues**: Verify you have read/write access to the folder
3. **Disk Space**: Ensure there's enough disk space

When an error occurs, inform the user and suggest checking the folder path and permissions.

## Safety Features

The skill includes several safety features:
- **No Overwrites**: If a file with the same name exists in the target category, it's skipped
- **Hidden Files Ignored**: Files starting with . or ~ are skipped
- **Directory Preservation**: Existing subdirectories are left untouched
- **Dry Run Mode**: Test without making changes
- **Detailed Reporting**: See exactly what was moved and what was skipped

## Implementation Details

The skill uses a bash script that:
1. Creates category folders if they don't exist
2. Iterates through files in the target directory
3. Determines category based on file extension
4. Moves files while checking for collisions
5. Generates a JSON report of the operation

## Extending This Skill

To add more file categories or extensions:

1. Edit the `EXTENSIONS` map in the skill script
2. Add new category names and their extensions
3. The skill will automatically create folders and move files

Example:
```bash
"Ebooks": "epub mobi azw3 pdf"
"3DModels": "obj fbx stl blend"
```
