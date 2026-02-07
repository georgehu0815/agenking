# Quick Start Guide

## Installation

1. Install mermaid-cli globally:
```bash
npm install -g @mermaid-js/mermaid-cli
```

2. Verify installation:
```bash
mmdc --version
```

## Basic Usage

### In Claude Code:

```
User: "Generate a diagram from docs/ARCHITECTURE.md and save as PDF"
```

Claude will automatically:
1. Read your architecture document
2. Generate a Mermaid diagram
3. Render to high-res PNG (3000x4000px)
4. Convert to PDF
5. Save both to `docs/` directory

### Command Form:

```
/doc-diagram-pdf <filepath>
```

Examples:
```
/doc-diagram-pdf docs/ARCHITECTURE.md
/doc-diagram-pdf README.md
/doc-diagram-pdf design/system-overview.md
```

## Manual Process (If needed)

If you want to manually render a diagram:

1. **Save Mermaid code** to a `.mmd` file:
```bash
nano architecture.mmd
# Paste your Mermaid diagram code
```

2. **Render to PNG**:
```bash
mmdc -i architecture.mmd -o architecture.png -w 3000 -H 4000 -s 3 -b transparent
```

3. **Convert to PDF**:

macOS:
```bash
sips -s format pdf architecture.png --out architecture.pdf
```

Linux (requires ImageMagick):
```bash
convert architecture.png architecture.pdf
```

## Parameters Explained

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `-i` | input.mmd | Input Mermaid file |
| `-o` | output.png | Output file name |
| `-w` | 3000 | Width in pixels |
| `-H` | 4000 | Height in pixels |
| `-s` | 3 | Scale factor (1-5) |
| `-b` | transparent | Background color |

## Testing the Skill

Try it with the sample architecture:

```bash
# From Claude Code:
/doc-diagram-pdf ~/.claude/skills/doc-diagram-pdf/examples/sample-architecture.md
```

This will generate:
- `sample-architecture_diagram.png`
- `sample-architecture_diagram.pdf`

## Tips for Best Results

✅ **Structure your docs with clear sections:**
```markdown
## Layer Name
- Component 1
- Component 2

## Another Layer
- Component 3
```

✅ **Mention technologies explicitly:**
```markdown
- Database: PostgreSQL
- Cache: Redis
- Queue: RabbitMQ
```

✅ **Describe data flows:**
```markdown
User → API → Service → Database
```

## Troubleshooting

### Problem: "mmdc: command not found"
**Solution:** Install mermaid-cli
```bash
npm install -g @mermaid-js/mermaid-cli
```

### Problem: "Permission denied"
**Solution:** Use sudo or fix npm permissions
```bash
sudo npm install -g @mermaid-js/mermaid-cli
```

### Problem: PDF conversion fails
**Solution (Linux):** Install ImageMagick
```bash
sudo apt-get install imagemagick
```

### Problem: Diagram is cut off
**Solution:** Increase dimensions
```bash
mmdc -i diagram.mmd -o diagram.png -w 4000 -H 5000 -s 4
```

## What You'll Get

### PNG Output
- High resolution (3000x4000 pixels)
- 3x scale for crisp text
- Transparent background
- Perfect for embedding in docs

### PDF Output
- Vector quality where possible
- Print-ready resolution
- Portable format
- Great for presentations

## Example Output Sizes

Typical file sizes:
- PNG: 1-2 MB
- PDF: 1.5-3 MB

Complex diagrams may be larger.

## Next Steps

- Read [SKILL.md](SKILL.md) for complete documentation
- Check [examples/](examples/) for sample diagrams
- Customize [templates/](templates/) for your needs

---

**Need Help?** Check the full documentation in SKILL.md or ask Claude!
