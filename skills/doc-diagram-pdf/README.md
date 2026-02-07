# Doc Diagram PDF Skill

Generate professional architecture diagrams from documentation and export as high-resolution PDF.

## Quick Usage

```bash
# In Claude Code, use the skill:
/doc-diagram-pdf docs/ARCHITECTURE.md

# Or reference in conversation:
"Generate a diagram from my architecture docs and save as PDF"
```

## What It Does

1. 📖 Reads your architecture/design documentation
2. 🎨 Generates a professional Mermaid diagram with color-coded layers
3. 🖼️ Renders to high-resolution PNG (3000x4000px, 3x scale)
4. 📄 Converts to PDF for presentations and printing
5. 💾 Saves both files to your `docs/` directory

## Output

- `<filename>_diagram.png` - High-resolution bitmap
- `<filename>_diagram.pdf` - Vector-quality PDF

## Requirements

Install mermaid-cli:
```bash
npm install -g @mermaid-js/mermaid-cli
```

Verify:
```bash
mmdc --version
```

## Features

✅ **Automatic Structure Detection**
- Layered architectures (N-tier, hexagonal, clean)
- Data flow pipelines
- Component relationships
- Technology stacks

✅ **Professional Styling**
- Semantic color coding
- Clear visual hierarchy
- Consistent typography
- Publication-quality output

✅ **Smart Layout**
- Vertical/horizontal flow detection
- Logical grouping with subgraphs
- Clear relationship arrows
- Optimized spacing

## Example

### Input: `docs/ARCHITECTURE.md`
```markdown
# Architecture

## Layers
1. API Layer - Handles requests
2. Business Layer - Core logic
3. Data Layer - Persistence
4. Infrastructure - Databases
```

### Output: `docs/architecture_diagram.pdf`
Beautiful multi-layer diagram with color-coded sections, arrows showing data flow, and clear labels.

## File Structure

```
doc-diagram-pdf/
├── SKILL.md              # Full documentation
├── README.md             # Quick reference (this file)
├── templates/            # Mermaid templates
│   └── layered-architecture.mmd
└── examples/             # Sample outputs
```

## Tips

💡 **Best Results:**
- Use clear section headers in your docs
- List components and their responsibilities
- Describe relationships between systems
- Include technology names (MongoDB, Redis, etc.)

💡 **Common Issues:**
- If mmdc not found: Install with `npm install -g @mermaid-js/mermaid-cli`
- If PDF conversion fails on Linux: Install ImageMagick
- If diagram is too small: Edit scale parameter in SKILL.md

## Related Skills

- `mermaid-visualizer` - Creates Mermaid diagrams (no PDF)
- `azure-diagrams` - Azure-specific diagrams
- `excalidraw-diagram` - Hand-drawn style diagrams

## See Full Documentation

For complete details, see [SKILL.md](SKILL.md)
