# Markdown to PDF Plugin for Clawdbot

Convert markdown files to professionally formatted PDF documents using Pandoc.

## Features

- ✅ **Runs on host system** - Access to pandoc and LaTeX binaries
- ✅ **Multiple PDF engines** - pdflatex, xelatex (Unicode), lualatex
- ✅ **Table of contents** - Auto-generate TOC
- ✅ **Code highlighting** - Syntax highlighting for code blocks
- ✅ **Customizable styling** - Margins, fonts, sizes

## Prerequisites

The plugin requires pandoc and LaTeX to be installed on your system:

```bash
# Install pandoc
brew install pandoc

# Install LaTeX (BasicTeX is sufficient)
brew install --cask basictex

# After BasicTeX installation, add to PATH
export PATH="/Library/TeX/texbin:$PATH"
```

## Installation

### Local Development

1. Copy the plugin to your clawdbot plugins directory:
   ```bash
   cp -r /Users/ghu/aiworker/clawdbot/plugins/markdown-to-pdf \
         /Users/ghu/.clawdbot/plugins/
   ```

2. Enable the plugin in your config (`~/.clawdbot/clawdbot.json`):
   ```json
   {
     "plugins": {
       "allow": ["markdown-to-pdf"],
       "entries": {
         "markdown-to-pdf": {
           "enabled": true,
           "config": {
             "pdfEngine": "xelatex",
             "defaultToc": true,
             "defaultNumberSections": true,
             "defaultMargin": "1in"
           }
         }
       }
     }
   }
   ```

3. Restart your gateway:
   ```bash
   pnpm run gateway:dev
   ```

## Usage

Once installed, the agent can use the `markdown_to_pdf` tool:

### Example Conversations

**User:** "Convert /Users/ghu/clawd/report.md to PDF"

**Agent:** *Uses markdown_to_pdf tool*
- Input: `/Users/ghu/clawd/report.md`
- Output: `/Users/ghu/clawd/report.pdf`
- Options: Default settings (xelatex, TOC, numbered sections)

**User:** "Convert architecture.md to PDF without table of contents"

**Agent:** *Uses markdown_to_pdf tool*
- Input: `/Users/ghu/clawd/architecture.md`
- Output: `/Users/ghu/clawd/architecture.pdf`
- Options: `{ toc: false }`

## Configuration

Configure defaults in your plugin config:

```json
{
  "plugins": {
    "entries": {
      "markdown-to-pdf": {
        "enabled": true,
        "config": {
          "pdfEngine": "xelatex",        // pdflatex | xelatex | lualatex
          "defaultToc": true,             // Include TOC by default
          "defaultNumberSections": true,  // Number sections by default
          "defaultMargin": "1in"          // Default page margin
        }
      }
    }
  }
}
```

## Tool Parameters

The `markdown_to_pdf` tool accepts:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputPath` | string | ✅ | Path to input markdown file |
| `outputPath` | string | ✅ | Path for output PDF file |
| `options.pdfEngine` | string | ❌ | LaTeX engine: `pdflatex`, `xelatex`, `lualatex` |
| `options.toc` | boolean | ❌ | Generate table of contents |
| `options.numberSections` | boolean | ❌ | Number section headings |
| `options.margin` | string | ❌ | Page margin (e.g., `1in`, `2.5cm`) |
| `options.fontSize` | string | ❌ | Font size: `10pt`, `11pt`, `12pt` |
| `options.highlightStyle` | string | ❌ | Code highlighting: `tango`, `pygments`, `kate` |

## PDF Engines

### pdflatex (Fast)
- **Best for:** Standard ASCII/Latin documents
- **Pros:** Fast, widely compatible
- **Cons:** Limited Unicode support

### xelatex (Recommended)
- **Best for:** Unicode documents, international text
- **Pros:** Excellent Unicode support
- **Cons:** Slightly slower

### lualatex (Advanced)
- **Best for:** Advanced LaTeX features
- **Pros:** Modern, extensible
- **Cons:** Slowest

## Limitations

- **Emojis:** Not supported by LaTeX fonts (will show as warnings)
- **Mermaid diagrams:** Not rendered (shown as code blocks)
- **File access:** Limited to agent's workspace directory
- **Large files:** May take longer to process

## Troubleshooting

### "pandoc not found"
- Install pandoc: `brew install pandoc`
- Verify: `which pandoc`

### "LaTeX not found"
- Install BasicTeX: `brew install --cask basictex`
- Add to PATH: `export PATH="/Library/TeX/texbin:$PATH"`
- Verify: `which xelatex`

### "Input file not found"
- Ensure file is in agent's workspace
- Use absolute paths
- Check file permissions

### Unicode characters not displaying
- Use `xelatex` engine instead of `pdflatex`
- Set `options.pdfEngine = "xelatex"`

## Architecture

```
User Request
    ↓
Clawdbot Agent (sandbox)
    ↓
markdown_to_pdf tool
    ↓
Plugin (runs on host)
    ↓
pandoc + LaTeX (host binaries)
    ↓
PDF Generated
```

**Key Insight:** The plugin runs on the host system, not in the agent sandbox, giving it access to system binaries like pandoc and pdflatex.

## Development

To modify the plugin:

1. Edit files in `/Users/ghu/aiworker/clawdbot/plugins/markdown-to-pdf/`
2. Rebuild if needed (TypeScript)
3. Restart gateway
4. Test with agent

## License

MIT
