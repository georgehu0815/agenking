# Doc Diagram PDF - User Guide

> **Generate professional architecture diagrams from documentation and export as high-resolution PDF**

---

## 📦 What Is This Skill?

The **doc-diagram-pdf** skill automatically converts your architecture and design documentation into beautiful, professional diagrams and exports them as high-quality PNG and PDF files. Perfect for presentations, documentation, and architectural reviews.

## 🎯 What You Get

When you use this skill, it:

1. **📖 Reads** your architecture/design documentation
2. **🔍 Analyzes** structure (layers, components, flows, relationships)
3. **🎨 Generates** professional Mermaid diagram with semantic color coding
4. **🖼️ Renders** to high-resolution PNG (3000x4000px, 3x scale)
5. **📄 Converts** to PDF for presentations and printing
6. **💾 Saves** both files to your `docs/` directory

### Output Files

- `<filename>_diagram.png` - High-resolution bitmap (1-2 MB)
- `<filename>_diagram.pdf` - Vector-quality PDF (1.5-3 MB)

---

## 🚀 How to Use

### Method 1: Natural Language (Easiest)

Simply tell Claude what you want:

```
"Generate a diagram from docs/ARCHITECTURE.md and save as PDF"
"Create an architecture diagram for my README"
"Make a visual diagram from my design docs"
"Convert my system architecture to a diagram"
```

Claude will automatically invoke this skill and generate the diagrams.

### Method 2: Direct Command

Use the skill command directly:

```
/doc-diagram-pdf <filepath>
```

**Examples:**
```bash
/doc-diagram-pdf docs/ARCHITECTURE.md
/doc-diagram-pdf README.md
/doc-diagram-pdf design/api-design.md
/doc-diagram-pdf system-overview.md
```

---

## 📋 Supported Documentation Types

The skill automatically detects and visualizes:

### ✅ Layered Architectures
- N-tier applications (3-tier, 4-tier, etc.)
- Hexagonal/Ports & Adapters architecture
- Clean Architecture
- Domain-Driven Design (DDD) layers
- Onion Architecture

**Example keywords detected:** "layer", "tier", "infrastructure", "business logic", "presentation", "domain"

### ✅ Data Flow Pipelines
- ETL processes
- Data ingestion pipelines
- Message processing flows
- Request/response patterns
- Event-driven architectures

**Example keywords detected:** "flow", "pipeline", "process", "transformation", "ingestion", "event"

### ✅ Component Architectures
- Microservices
- Service-oriented architecture (SOA)
- Module relationships
- System integrations
- API ecosystems

**Example keywords detected:** "component", "module", "service", "microservice", "integration", "adapter"

### ✅ Technology Stacks
- Database architectures
- Infrastructure setups
- Deployment diagrams
- Service mesh
- Container orchestration

**Example keywords detected:** Database names (MongoDB, PostgreSQL), cache systems (Redis), messaging (RabbitMQ, Kafka), etc.

---

## ✨ Features

### 🎨 Professional Styling

**Semantic Color Coding:**
- 🟦 **Blue** - User interfaces, external systems
- 🟩 **Green** - Orchestration, coordination layers
- 🟨 **Yellow** - Storage, data, memory layers
- 🟦 **Cyan** - Retrieval, queries, output
- 🟪 **Purple** - Business logic, processing
- 🟧 **Orange** - Infrastructure, external services
- ⬜ **Gray** - Framework, utilities, support
- 🟥 **Red** - Critical components, databases

### 📐 Smart Layout

- **Automatic flow detection** (vertical/horizontal)
- **Logical grouping** with labeled subgraphs
- **Clear relationships** with labeled arrows
- **Consistent typography** and spacing
- **Visual hierarchy** for easy understanding

### 🎯 High Quality Output

- **3000x4000 pixels** base resolution
- **3x scale factor** for crisp text
- **Transparent background** (PNG)
- **Print-ready** PDF format
- **Publication quality** for presentations

---

## 🧪 Try It Now

### Test with Sample Document

The skill includes a sample architecture document you can test with:

```bash
/doc-diagram-pdf ~/.claude/skills/doc-diagram-pdf/examples/sample-architecture.md
```

This will generate:
- `sample-architecture_diagram.png`
- `sample-architecture_diagram.pdf`

### Use with Your Own Docs

```bash
/doc-diagram-pdf docs/ARCHITECTURE.md
/doc-diagram-pdf README.md
```

---

## 📚 Skill Structure

```
doc-diagram-pdf/
├── SKILL.md                              # Complete technical documentation
├── README.md                             # Quick reference card
├── QUICKSTART.md                         # Installation & basic usage
├── USER_GUIDE.md                         # This file - comprehensive guide
├── examples/                             # Example files
│   ├── evermemos_architecture.mmd       # Real-world example (EverMemOS)
│   └── sample-architecture.md           # Sample document to test with
└── templates/                            # Reusable Mermaid templates
    └── layered-architecture.mmd         # Generic layered architecture
```

---

## 💡 Tips for Best Results

### ✅ Structure Your Documentation

**Good structure:**
```markdown
# System Architecture

## API Layer
- REST endpoints
- Authentication
- Rate limiting

## Business Layer
- Order processing
- Payment handling
- Inventory management

## Data Layer
- PostgreSQL database
- Redis cache
```

**Clear sections** = Better diagrams

### ✅ Name Technologies Explicitly

**Include technology names:**
```markdown
- Database: PostgreSQL 15
- Cache: Redis 7
- Message Queue: RabbitMQ
- Search: Elasticsearch
```

This helps the skill identify infrastructure components.

### ✅ Describe Relationships

**Show data flows:**
```markdown
## Data Flow
1. User sends request → API Gateway
2. API Gateway → Authentication Service
3. Authentication Service → Business Logic
4. Business Logic → Database
5. Database → Cache
6. Response back to User
```

**Use arrows** (→) or numbered steps to show flow.

### ✅ Use Consistent Terminology

- Stick to terms like "Layer", "Service", "Component"
- Be consistent with component names
- Use clear, descriptive headers

---

## 🔧 Prerequisites

### Required: Mermaid CLI

The skill requires `mermaid-cli` (mmdc) to render diagrams.

**Installation:**
```bash
npm install -g @mermaid-js/mermaid-cli
```

**Verify:**
```bash
mmdc --version
# Should show: @mermaid-js/mermaid-cli version X.X.X
```

**Alternative installation methods:**
```bash
# Using yarn
yarn global add @mermaid-js/mermaid-cli

# Using pnpm
pnpm add -g @mermaid-js/mermaid-cli
```

### Optional: Image Conversion Tools

**macOS:**
- `sips` (built-in) - Used automatically for PNG to PDF conversion

**Linux:**
- ImageMagick: `sudo apt-get install imagemagick`
- Used for PNG to PDF conversion on Linux systems

---

## 🎓 Real-World Example

### Input Document: `docs/ARCHITECTURE.md`

The EverMemOS project architecture document was used to create the first diagram with this skill.

**Document contained:**
- 6 architectural layers
- 20+ components
- 2 main data flows (memory construction & retrieval)
- Multiple technology integrations

**Generated Output:**
- Professional multi-layer diagram
- Color-coded layers and components
- Clear data flow paths
- Infrastructure connections
- 1.7 MB PDF ready for presentations

**Files created:**
- Source: [examples/evermemos_architecture.mmd](examples/evermemos_architecture.mmd)
- Output: `docs/evermemos_architecture.pdf`

This demonstrates the skill's ability to handle complex, real-world architectures.

---

## ❓ Troubleshooting

### Problem: "mmdc: command not found"

**Solution:** Install mermaid-cli
```bash
npm install -g @mermaid-js/mermaid-cli
```

If you get permission errors:
```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g @mermaid-js/mermaid-cli

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g @mermaid-js/mermaid-cli
```

### Problem: "Cannot find module 'puppeteer'"

**Solution:** Reinstall mermaid-cli with all dependencies
```bash
npm uninstall -g @mermaid-js/mermaid-cli
npm install -g @mermaid-js/mermaid-cli
```

### Problem: PDF conversion fails

**Solution (macOS):** Should work automatically with `sips`

**Solution (Linux):** Install ImageMagick
```bash
sudo apt-get install imagemagick

# Or on Fedora/CentOS
sudo yum install imagemagick
```

### Problem: Diagram is cut off or too small

**Solution:** The skill uses optimal settings by default (3000x4000, 3x scale)

If you need to manually adjust:
```bash
mmdc -i diagram.mmd -o diagram.png -w 4000 -H 5000 -s 4
```

### Problem: Syntax error in generated Mermaid diagram

**Solution:** The skill follows strict syntax rules to avoid this. If it happens:
1. Check the `.mmd` file in the scratchpad
2. Common issues:
   - Space after number: `[1. Text]` → Use `[1.Text]`
   - Subgraph naming: `subgraph Name` → Use `subgraph id["Name"]`
3. Report the issue so the skill can be improved

---

## 🚀 Advanced Usage

### Multiple Diagrams from One Doc

You can generate different views of the same architecture:

```
"Create a high-level diagram focusing on layers"
"Create a detailed diagram showing all components"
"Create a data flow diagram from the architecture doc"
```

### Custom Output Locations

By default, files save to `docs/`. To customize:
1. Edit the skill's execution
2. Or move files after generation:
```bash
mv docs/architecture_diagram.pdf presentations/
```

### Integration with Documentation

**Embed PNG in Markdown:**
```markdown
![Architecture Diagram](evermemos_architecture_diagram.png)
```

**Link to PDF:**
```markdown
[📄 View Full Architecture (PDF)](evermemos_architecture_diagram.pdf)
```

### Version Control

**Recommended approach:**
```bash
# Commit both source and output
git add docs/ARCHITECTURE.md
git add docs/architecture_diagram.png
git add docs/architecture_diagram.pdf
git commit -m "docs: update architecture diagram"
```

**Alternative (source only):**
```bash
# Add output files to .gitignore if you regenerate them
echo "docs/*_diagram.png" >> .gitignore
echo "docs/*_diagram.pdf" >> .gitignore
```

---

## 📊 Output Specifications

### PNG Output
- **Format:** PNG (Portable Network Graphics)
- **Resolution:** 3000x4000 pixels (base)
- **Scale:** 3x (9000x12000 effective resolution)
- **Background:** Transparent
- **Color depth:** 24-bit RGB
- **Typical size:** 1-2 MB

**Best for:**
- Embedding in documentation
- Web display
- Quick sharing

### PDF Output
- **Format:** PDF (Portable Document Format)
- **Quality:** Vector-quality (converted from high-res PNG)
- **Compression:** Optimized
- **Typical size:** 1.5-3 MB
- **Print ready:** Yes (300+ DPI equivalent)

**Best for:**
- Presentations (PowerPoint, Keynote, Google Slides)
- Printing
- Formal documentation
- Archival

---

## 🎨 Diagram Types Generated

### 1. Layered Architecture (Most Common)
```
┌─────────────────────────┐
│    Presentation Layer   │
├─────────────────────────┤
│    Business Layer       │
├─────────────────────────┤
│    Data Layer           │
├─────────────────────────┤
│    Infrastructure       │
└─────────────────────────┘
```

### 2. Data Flow Diagram
```
Input → Process → Transform → Store → Output
   ↓        ↓          ↓         ↓
 Validate  Log    Enrich    Cache
```

### 3. Component Diagram
```
┌──────────┐      ┌──────────┐
│ Service A│─────→│ Service B│
└──────────┘      └──────────┘
     │                  │
     ↓                  ↓
┌──────────┐      ┌──────────┐
│Database A│      │Database B│
└──────────┘      └──────────┘
```

---

## 📖 Related Documentation

- **[SKILL.md](SKILL.md)** - Complete technical documentation
  - All configuration options
  - Detailed syntax rules
  - Troubleshooting guide
  - Advanced features

- **[README.md](README.md)** - Quick reference card
  - One-page overview
  - Quick commands
  - Common patterns

- **[QUICKSTART.md](QUICKSTART.md)** - Getting started guide
  - Installation steps
  - First diagram
  - Basic usage

---

## 🤝 When to Use This Skill

### ✅ Perfect For:

- **Architecture documentation** - Visualize system layers and components
- **Design reviews** - Create diagrams for stakeholder presentations
- **Technical proposals** - Illustrate proposed architectures
- **Onboarding materials** - Help new team members understand the system
- **Documentation updates** - Keep diagrams in sync with architecture
- **Blog posts** - Add professional visuals to technical writing
- **Conference talks** - Create presentation-ready diagrams

### ⚠️ Not Ideal For:

- **Hand-drawn style diagrams** - Use `excalidraw-diagram` skill instead
- **Mind maps** - Use `obsidian-canvas-creator` skill
- **Azure-specific diagrams** - Use `azure-diagrams` skill
- **Interactive diagrams** - Generate static images only
- **Real-time collaboration** - Creates static output files

---

## 🌟 Key Benefits

1. **⚡ Fast** - Generates diagrams in seconds
2. **🎯 Accurate** - Analyzes documentation structure intelligently
3. **🎨 Professional** - Publication-quality output
4. **🔄 Reusable** - Works with any architecture document
5. **📦 Complete** - Both PNG and PDF output
6. **🎓 No Mermaid knowledge required** - Automatic generation
7. **✅ Syntax-safe** - Follows best practices to avoid errors
8. **🖨️ Print-ready** - High-resolution output

---

## 💬 Feedback & Support

### Questions?
- Read the [SKILL.md](SKILL.md) for detailed documentation
- Check [QUICKSTART.md](QUICKSTART.md) for installation help
- Try the [sample document](examples/sample-architecture.md)

### Issues?
- Verify `mmdc` is installed: `mmdc --version`
- Check output in scratchpad directory
- Review error messages for syntax issues

### Improvements?
- Edit the skill files in `~/.claude/skills/doc-diagram-pdf/`
- Share your templates in the `templates/` directory
- Contribute examples to the `examples/` directory

---

## 📅 Version History

- **v1.0** (2026-02-06)
  - Initial release
  - Architecture document analysis
  - Mermaid diagram generation
  - High-resolution PNG/PDF export
  - Semantic color coding
  - Layered architecture support
  - Data flow visualization
  - Component relationship mapping

---

## 🎓 Learning Resources

### Understanding Mermaid Diagrams
- [Mermaid Official Docs](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)

### Architecture Documentation
- [C4 Model](https://c4model.com/) - For system architecture diagrams
- [Arc42](https://arc42.org/) - Architecture documentation template

### Best Practices
- Keep diagrams focused (one diagram per concern)
- Use consistent naming conventions
- Update diagrams when architecture changes
- Version control both docs and diagrams

---

## ✨ Pro Tips

1. **Keep docs structured** - Use clear headers and sections
2. **Name your technologies** - Mention specific tools (Redis, PostgreSQL, etc.)
3. **Describe flows** - Use arrows or numbered steps
4. **Be consistent** - Use the same terms throughout
5. **Update regularly** - Regenerate diagrams when architecture changes
6. **Review output** - Check the generated diagram for accuracy
7. **Use in presentations** - PDF output is perfect for slides
8. **Embed in docs** - PNG output works great in markdown

---

**Ready to create beautiful architecture diagrams? Start by running:**

```
/doc-diagram-pdf docs/ARCHITECTURE.md
```

**Or simply ask Claude:**

```
"Generate a diagram from my architecture documentation"
```

Happy diagramming! 🎉
