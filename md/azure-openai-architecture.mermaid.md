# Azure OpenAI Managed Identity System Architecture - Mermaid Diagram

```mermaid
graph TB
    %% Define styles
    classDef externalLayer fill:#dbeafe,stroke:#1e40af,stroke-width:2px
    classDef authLayer fill:#eff6ff,stroke:#3b82f6,stroke-width:2px
    classDef integrationLayer fill:#f5f3ff,stroke:#8b5cf6,stroke-width:2px
    classDef coreLayer fill:#fffbeb,stroke:#f59e0b,stroke-width:2px
    classDef configLayer fill:#ecfdf5,stroke:#10b981,stroke-width:2px
    classDef uiLayer fill:#eef2ff,stroke:#6366f1,stroke-width:2px

    %% User Interfaces Layer
    subgraph ui["👤 User Interfaces Layer"]
        UI1[Control UI Dashboard]
        UI2[TUI Onboarding Wizard]
        UI3[CLI Commands]
    end

    %% Configuration Layer
    subgraph config["⚙️ Configuration Layer"]
        CONFIG["~/.clawdbot/clawdbot.json<br/>Auth profiles 「managedidentity」<br/>Model providers | Agent defaults"]
    end

    %% Clawdbot Core Layer
    subgraph core["🤖 Clawdbot Core Layer"]
        RUNNER["Pi Embedded Runner<br/>• Model resolution<br/>• Auth profile mgmt<br/>• Stream fn swapping<br/>• Detects managedidentity"]
        ADAPTER["Stream Adapter<br/>azure-openai-stream-adapter.ts<br/>• Pi → LangChain conversion<br/>• Event stream handling<br/>• Error handling"]
        RUNTIME["Azure OpenAI Runtime<br/>azure-openai-runtime.ts<br/>• Credential selection<br/>• Model caching<br/>• Token provider init"]
    end

    %% Integration Layer
    subgraph integration["🔗 Integration Layer"]
        LANGCHAIN["LangChain Library<br/>「@langchain/openai」<br/>AzureChatOpenAI Client<br/>Message Conversion | Streaming"]
    end

    %% Authentication Layer
    subgraph auth["🔐 Authentication Layer"]
        MANAGED["ManagedIdentity Credential<br/>「Production」"]
        CLI["AzureCli Credential<br/>「Development」"]
        TOKEN["Bearer Token Provider"]
    end

    %% External Services Layer
    subgraph external["☁️ External Services Layer"]
        AZURE["Azure OpenAI Service<br/>GPT-5.2 Deployment<br/>API: 2024-12-01-preview"]
    end

    %% Data Flow Connections
    UI1 & UI2 & UI3 -->|User message| RUNNER
    RUNNER -->|Gateway routing| ADAPTER
    ADAPTER -->|Convert to LangChain format| RUNTIME
    RUNTIME -->|Select credential| MANAGED
    RUNTIME -.->|Dev mode| CLI
    MANAGED & CLI --> TOKEN
    TOKEN -->|Bearer token| LANGCHAIN
    LANGCHAIN -->|Authenticated API call| AZURE
    AZURE -->|Stream response| LANGCHAIN
    LANGCHAIN -->|LangChain events| RUNTIME
    RUNTIME -->|Convert to Pi format| ADAPTER
    ADAPTER -->|Stream chunks| RUNNER
    RUNNER -->|Response| UI1 & UI2 & UI3

    %% Configuration connections
    CONFIG -.->|Read auth profiles| RUNTIME
    CONFIG -.->|Model provider config| RUNNER

    %% Apply styles
    class UI1,UI2,UI3 uiLayer
    class CONFIG configLayer
    class RUNNER,ADAPTER,RUNTIME coreLayer
    class LANGCHAIN integrationLayer
    class MANAGED,CLI,TOKEN authLayer
    class AZURE externalLayer
```

## Architecture Overview

This diagram shows the **Azure OpenAI Managed Identity integration** within the Clawdbot system, organized into 6 distinct layers:

### 📊 Data Flow Path
1. **User message** enters via UI (Dashboard/TUI/CLI)
2. **Gateway** routes to Pi Embedded Runner
3. **Runner** forwards to Stream Adapter
4. **Adapter** converts Pi format → LangChain format
5. **Runtime** selects credential (ManagedIdentity in prod, AzureCli in dev)
6. **Authentication** layer provides Bearer token
7. **LangChain** makes authenticated API call to Azure
8. **Azure OpenAI** streams response back through the stack
9. **Response** converted back to Pi format and delivered to user

### 🔑 Key Components

- **ManagedIdentity Credential**: Production authentication (no keys required)
- **AzureCli Credential**: Development authentication (uses `az login`)
- **Bearer Token Provider**: Converts Azure credentials to OpenAI bearer tokens
- **Stream Adapter**: Bidirectional format conversion between Pi and LangChain
- **Runtime**: Manages credential selection, model caching, and token initialization

### 📝 Configuration

All settings managed via `~/.clawdbot/clawdbot.json`:
- Auth profiles (including `managedidentity`)
- Model provider configurations
- Agent defaults
