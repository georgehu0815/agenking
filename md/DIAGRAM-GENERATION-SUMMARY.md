# Azure OpenAI Integration - Diagram Generation Summary

## ✅ Completed Successfully

All diagram files have been generated and converted to PDF format.

## Generated Files

### 📊 Diagram Files

| File | Type | Size | Description |
|------|------|------|-------------|
| **azure-openai-system-architecture.excalidraw.md** | Source | 37 KB | Editable Excalidraw format |
| **azure-openai-system-architecture.pdf** | PDF | 423 KB | System architecture diagram (6 layers) |
| **azure-openai-class-design.excalidraw.md** | Source | 39 KB | Editable Excalidraw format |
| **azure-openai-class-design.pdf** | PDF | 347 KB | Class design diagram (7 components) |
| **DIAGRAMS-README.md** | Documentation | - | Usage guide and diagram descriptions |

### 🛠️ Conversion Tools

| File | Purpose |
|------|---------|
| **convert-diagrams-to-pdf.py** | Python script to convert Excalidraw to PDF |
| **render-diagram.html** | HTML template for rendering diagrams |

## Diagram Contents

### System Architecture Diagram (PDF)

A comprehensive 6-layer architecture showing:

1. **External Services Layer** (Blue)
   - Azure OpenAI Service with GPT-5.2 deployment

2. **Authentication Layer** (Light Blue)
   - ManagedIdentityCredential (Production)
   - AzureCliCredential (Development)
   - Bearer Token Provider

3. **Integration Layer** (Purple)
   - LangChain Library (@langchain/openai)
   - AzureChatOpenAI Client
   - Message conversion and streaming

4. **Clawdbot Core** (Orange/Gold)
   - Azure OpenAI Runtime (credential selection, model caching)
   - Stream Adapter (Pi → LangChain conversion, event streaming)
   - Pi Embedded Runner (model resolution, stream function swapping)

5. **Configuration Layer** (Green)
   - Config files with auth profiles (managedidentity mode)
   - Model provider settings
   - Agent defaults

6. **User Interfaces** (Indigo)
   - Control UI Dashboard
   - TUI Onboarding Wizard
   - CLI Commands

**Plus**: Complete data flow visualization showing the path from user message → gateway → runner → adapter → runtime → auth → Azure → streamed response.

### Class Design Diagram (PDF)

Detailed class-level implementation showing:

1. **azure-openai-models.ts**
   - Configuration constants (endpoint, deployment, API version, client ID)

2. **azure-openai-runtime.ts**
   - `getAzureOpenAIModelInstance()` function with credential selection
   - Model caching mechanism
   - Token provider initialization

3. **azure-openai-stream-adapter.ts**
   - `streamAzureOpenAIManagedIdentity()` function
   - Pi Context → LangChain message conversion
   - Event stream lifecycle (start, text_delta, text_end, done)
   - Error handling

4. **pi-embedded-runner/run/attempt.ts**
   - Azure OpenAI + managedidentity detection logic
   - Stream function swapping mechanism

5. **pi-embedded-runner/run.ts & compact.ts**
   - Authentication bypass logic for managedidentity mode
   - Placeholder API key handling for Pi library compatibility

6. **Configuration Types**
   - AuthProfileConfig (mode types)
   - ModelProviderAuthMode (managedidentity, api-key, oauth, etc.)
   - ProviderConfig structure

7. **External Dependencies**
   - @azure/identity (ManagedIdentityCredential, AzureCliCredential, getBearerTokenProvider)
   - @langchain/openai (AzureChatOpenAI, message types)

**Relationships**: Shows class interactions through:
- Function calls (solid arrows)
- Configuration reads (dashed arrows)
- Credential provisioning
- Library usage

## Design Highlights

### Color Coding
- **Blue** (#1e40af, #3b82f6): External services and authentication
- **Purple** (#8b5cf6): Integration layer
- **Orange/Gold** (#f59e0b): Core Clawdbot components
- **Green** (#10b981): Configuration
- **Indigo** (#6366f1): User interfaces
- **Red** (#dc2626): External dependencies

### Typography
- All text uses Excalifont (handwritten style)
- Titles: 28px
- Layer headers: 20px
- Component text: 14-16px
- All elements maintain 1.25 line height for readability

### Layout
- Clean layer-based organization (system architecture)
- Logical grouping of related classes (class design)
- Clear arrow relationships showing data/control flow
- Appropriate spacing and alignment

## How to Use the Files

### View PDF Files
Simply open the PDF files in any PDF viewer:
- `azure-openai-system-architecture.pdf`
- `azure-openai-class-design.pdf`

### Edit Source Files (Excalidraw format)
1. Open in Obsidian with Excalidraw plugin installed
2. Click "MORE OPTIONS" → "Switch to EXCALIDRAW VIEW"
3. Edit and export as needed

Alternatively, upload the `.excalidraw.md` files to https://excalidraw.com

### Regenerate PDFs
If you modify the source `.excalidraw.md` files and need to regenerate the PDFs:

```bash
python3 convert-diagrams-to-pdf.py
```

**Requirements:**
- Python 3.7+
- Playwright: `pip3 install playwright`
- Chromium: `python3 -m playwright install chromium`

## Technical Implementation

### Authentication Flow
- **Production**: ManagedIdentityCredential with client ID YOUR-MANAGED-IDENTITY-CLIENT-ID
- **Development**: AzureCliCredential (uses Azure CLI credentials)
- **Scope**: https://cognitiveservices.azure.com/.default

### Key Integration Points
1. Runtime detects `NODE_ENV` and selects appropriate credential
2. Creates bearer token provider using @azure/identity
3. Initializes AzureChatOpenAI **without** API key (token provider only)
4. Runner detects `azureopenai` + `managedidentity` configuration
5. Swaps to custom stream adapter
6. Adapter converts Pi Context → LangChain messages
7. Streams response through event pipeline

### Configuration Structure
```json
{
  "auth": {
    "profiles": {
      "azureopenai:default": {
        "provider": "azureopenai",
        "mode": "managedidentity"
      }
    }
  },
  "models": {
    "providers": {
      "azureopenai": {
        "auth": "managedidentity",
        "baseUrl": "https://YOUR-RESOURCE.cognitiveservices.azure.com/",
        "api": "openai-completions"
      }
    }
  }
}
```

## Documentation References

For more details, see:
- [DIAGRAMS-README.md](DIAGRAMS-README.md) - Complete usage guide
- [azure-openai-runtime.ts](src/agents/azure-openai-runtime.ts) - Runtime implementation
- [azure-openai-stream-adapter.ts](src/agents/azure-openai-stream-adapter.ts) - Stream adapter
- [azure-openai-models.ts](src/agents/azure-openai-models.ts) - Configuration constants

## Summary

✅ **System Architecture Diagram**: 6 layers, complete data flow, 423 KB PDF
✅ **Class Design Diagram**: 7 components, detailed relationships, 347 KB PDF
✅ **Documentation**: Complete README and summary
✅ **Conversion Tools**: Automated PDF generation from Excalidraw source

All diagrams are production-ready and suitable for:
- Technical documentation
- Architecture reviews
- Team presentations
- Onboarding materials
- Design discussions
