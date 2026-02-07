# Architecture Diagram to PDF Generator

## Overview

Automatically generates professional architecture diagrams from documentation files and exports them as high-resolution PNG and PDF files. This skill reads architecture/technical documentation, creates Mermaid diagrams, and renders them using mermaid-cli (mmdc) at publication quality.

## Quick Start

**Usage:**
```
/doc-diagram-pdf <path-to-documentation-file>
```

**Examples:**
```
/doc-diagram-pdf docs/ARCHITECTURE.md
/doc-diagram-pdf README.md
/doc-diagram-pdf design/system-design.md
```

## What This Skill Does

1. **Reads Documentation** - Analyzes the provided markdown or text file
2. **Identifies Structure** - Detects layers, components, flows, and relationships
3. **Generates Mermaid Diagram** - Creates syntactically correct Mermaid code optimized for architecture visualization
4. **Renders High-Resolution Output** - Uses mermaid-cli to generate crisp, clear images
5. **Exports Multiple Formats** - Saves both PNG (for embedding) and PDF (for printing/presentations)
6. **Saves to Project** - Places files in the docs directory for easy access

## Output Files

The skill generates two files with automatic naming:

- **PNG**: `<original-filename>_diagram.png` - High-res bitmap (1.0-2.0 MB)
- **PDF**: `<original-filename>_diagram.pdf` - Vector-quality PDF (1.5-3.0 MB)

Default location: `docs/` directory in the project root (or same directory as source file)

## Prerequisites

**Required Tools:**
- `mmdc` (mermaid-cli) - Install with: `npm install -g @mermaid-js/mermaid-cli`
- Node.js and npm

**Verify installation:**
```bash
which mmdc  # Should return path to mmdc
mmdc --version  # Should show version number
```

## Diagram Types Supported

This skill automatically detects and generates appropriate diagrams for:

### 1. Layered Architecture
- Microservices architecture
- N-tier applications
- Hexagonal/Clean architecture
- Domain-driven design layers

**Detects:** Keywords like "layer", "tier", "infrastructure", "business logic", "presentation"

### 2. Data Flow Diagrams
- Pipeline architectures
- ETL processes
- Message flows
- Request/response patterns

**Detects:** "flow", "pipeline", "process", "transformation", "ingestion"

### 3. Component Diagrams
- System components
- Module relationships
- Service dependencies
- Integration patterns

**Detects:** "component", "module", "service", "integration", "adapter"

### 4. Technology Stack
- Database architecture
- Deployment architecture
- Infrastructure setup
- Service mesh

**Detects:** Technology names (MongoDB, Redis, Kubernetes, etc.)

## Configuration Options

### Rendering Quality (Default: High)

The skill uses these optimal settings:
- **Width**: 3000px (ensures text clarity)
- **Height**: 4000px (accommodates complex diagrams)
- **Scale**: 3x (publication quality)
- **Background**: Transparent (flexible for different backgrounds)
- **Format**: PNG → PDF conversion via sips (macOS) or ImageMagick (Linux)

### Custom Output Path

By default, files are saved to `docs/` directory. To customize:
- Edit the output path in the skill execution
- Or provide a second argument: `/doc-diagram-pdf <file> <output-dir>`

## Workflow

### Step 1: Analyze Documentation
```
- Read the input file
- Identify document type (architecture, API, system design)
- Extract key concepts: layers, components, flows, technologies
- Detect relationships and dependencies
```

### Step 2: Design Diagram
```
- Choose diagram type (graph TB, sequence, C4, etc.)
- Map document structure to visual elements
- Apply color coding for different categories
- Add clear labels and groupings
```

### Step 3: Generate Mermaid Code
```
- Create syntactically correct Mermaid diagram
- Follow best practices:
  ✓ Use subgraphs for logical grouping
  ✓ Color-code by function/layer
  ✓ Add clear arrow labels for relationships
  ✓ Include legend if needed
  ✓ Avoid common syntax errors (see Syntax Rules below)
```

### Step 4: Render to Files
```
- Save Mermaid code to temporary .mmd file
- Execute: mmdc -i diagram.mmd -o diagram.png -w 3000 -H 4000 -s 3
- Convert PNG to PDF: sips -s format pdf diagram.png --out diagram.pdf
- Copy files to docs/ directory
- Report file locations and sizes
```

## Color Scheme

The skill uses semantic color coding:

| Color | Usage | Hex Codes |
|-------|-------|-----------|
| 🟦 Blue | User interface, external systems | #e7f5ff / #1971c2 |
| 🟩 Green | Input, orchestration, start states | #d3f9d8 / #2f9e44 |
| 🟨 Yellow | Storage, data, memory layers | #fff4e6 / #e67700 |
| 🟦 Cyan | Retrieval, queries, output | #c5f6fa / #0c8599 |
| 🟪 Purple | Business logic, processing | #e5dbff / #5f3dc4 |
| 🟧 Orange | Infrastructure, external services | #ffe8cc / #d9480f |
| ⬜ Gray | Framework, utilities, support | #f8f9fa / #868e96 |
| 🟥 Red | Critical components, databases | #ffe3e3 / #c92a2a |

## Critical Syntax Rules

To ensure diagrams render correctly:

### ✅ DO:
- Use `subgraph id["Display Name"]` format for subgraphs
- Use `Node["Text<br/>with breaks"]` for multi-line labels
- Reference subgraph IDs (not display names) in connections
- Escape special characters in node text
- Use consistent arrow types: `-->` solid, `-.->` dashed

### ❌ DON'T:
- Use `[1. Text]` - space after number triggers markdown list error
  - Fix: Use `[1.Text]` or `[① Text]` or `[Step 1: Text]`
- Use `subgraph Display Name` without quotes and ID
- Mix up subgraph IDs and display names in connections
- Forget to close subgraphs

## Examples

### Example 1: Layered Architecture

**Input:** `docs/ARCHITECTURE.md` describing 6-layer system

**Output:** Mermaid diagram with:
- 6 color-coded subgraphs (layers)
- Component boxes within each layer
- Solid arrows for data flow
- Dashed arrows for supporting relationships
- Clear visual hierarchy top-to-bottom

### Example 2: Data Pipeline

**Input:** `design/data-pipeline.md` describing ETL process

**Output:** Mermaid diagram with:
- Sequential flow left-to-right
- Data sources, transformations, and destinations
- Parallel processing branches
- Error handling paths
- Storage systems

### Example 3: Microservices

**Input:** `README.md` with services overview

**Output:** Mermaid diagram with:
- Service boxes with responsibilities
- API gateways and load balancers
- Database connections
- Message queue integrations
- External service dependencies

## Troubleshooting

### Issue: `mmdc: command not found`
**Solution:** Install mermaid-cli
```bash
npm install -g @mermaid-js/mermaid-cli
# or with yarn
yarn global add @mermaid-js/mermaid-cli
```

### Issue: "Syntax error in mermaid diagram"
**Solution:** Check for:
- Space after numbers in brackets `[1. Text]` → `[1.Text]`
- Subgraph naming: `subgraph Name` → `subgraph id["Name"]`
- Unclosed subgraphs
- Special characters in node text

### Issue: "Diagram is too small/blurry"
**Solution:** Increase rendering quality
```bash
mmdc -i diagram.mmd -o diagram.png -w 4000 -H 5000 -s 4
```

### Issue: "PDF conversion failed"
**Solution:**
- macOS: Use `sips` (built-in)
- Linux: Install ImageMagick: `sudo apt-get install imagemagick`
- Alternative: Use online PNG to PDF converter

## Advanced Usage

### Custom Styling

Modify the Mermaid code to customize appearance:

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#ff6b6b'}}}%%
graph TB
    ...
```

### Multiple Diagrams

Generate separate diagrams for different aspects:
```
/doc-diagram-pdf docs/ARCHITECTURE.md --focus layers
/doc-diagram-pdf docs/ARCHITECTURE.md --focus dataflow
/doc-diagram-pdf docs/ARCHITECTURE.md --focus components
```

### Integration with CI/CD

Automate diagram generation in CI pipeline:
```yaml
- name: Generate architecture diagrams
  run: |
    npm install -g @mermaid-js/mermaid-cli
    claude-code --skill doc-diagram-pdf docs/ARCHITECTURE.md
```

## Best Practices

1. **Keep Documentation Updated** - Run skill after major architecture changes
2. **Version Control Diagrams** - Commit both .mmd source and .pdf output
3. **Review Before Publishing** - Check diagram accuracy and clarity
4. **Use Consistent Naming** - Follow project conventions for file names
5. **Include in Documentation** - Reference diagrams in README and docs

## Limitations

- Works best with well-structured markdown documentation
- Requires mermaid-cli to be installed
- Very complex diagrams (50+ nodes) may need manual optimization
- Some exotic diagram types may require custom Mermaid code

## Related Skills

- **mermaid-visualizer** - Creates Mermaid diagrams from text (no PDF export)
- **azure-diagrams** - Azure-specific architecture diagrams
- **excalidraw-diagram** - Hand-drawn style diagrams for Obsidian

## Version History

- **v1.0** (2026-02-06) - Initial release
  - Architecture document analysis
  - Mermaid diagram generation
  - High-resolution PNG/PDF export
  - Semantic color coding
  - Layered architecture support

## Feedback & Contributions

Found a bug or have a feature request?
- Submit issues at your Claude Code repository
- Extend this skill by editing `/Users/ghu/.claude/skills/doc-diagram-pdf/SKILL.md`

---

**Pro Tip:** For best results, ensure your architecture documentation has clear section headers, lists of components, and descriptions of relationships between systems.
