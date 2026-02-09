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
        ADAPTER["Native Stream Adapter<br/>azure-openai-stream-adapter-native.ts<br/>• Native OpenAI format<br/>• Event stream handling<br/>• Error handling"]
        CLIENT["Native Azure OpenAI Client<br/>azure-openai-native-client.ts<br/>• Direct API integration<br/>• Credential selection<br/>• Model caching<br/>• Token provider init"]
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
    ADAPTER -->|Native OpenAI format| CLIENT
    CLIENT -->|Select credential| MANAGED
    CLIENT -.->|Dev mode| CLI
    MANAGED & CLI --> TOKEN
    TOKEN -->|Bearer token| CLIENT
    CLIENT -->|Authenticated API call| AZURE
    AZURE -->|Stream response| CLIENT
    CLIENT -->|Native events| ADAPTER
    ADAPTER -->|Stream chunks| RUNNER
    RUNNER -->|Response| UI1 & UI2 & UI3

    %% Configuration connections
    CONFIG -.->|Read auth profiles| CLIENT
    CONFIG -.->|Model provider config| RUNNER

    %% Apply styles
    class UI1,UI2,UI3 uiLayer
    class CONFIG configLayer
    class RUNNER,ADAPTER,CLIENT coreLayer
    class MANAGED,CLI,TOKEN authLayer
    class AZURE externalLayer
```

## Architecture Overview

This diagram shows the **Azure OpenAI Managed Identity integration** within the Clawdbot system, organized into 5 distinct layers:

### 📊 Data Flow Path
1. **User message** enters via UI (Dashboard/TUI/CLI)
2. **Gateway** routes to Pi Embedded Runner
3. **Runner** forwards to Native Stream Adapter
4. **Adapter** processes native OpenAI format
5. **Native Client** selects credential (ManagedIdentity in prod, AzureCli in dev)
6. **Authentication** layer provides Bearer token
7. **Native Client** makes authenticated API call directly to Azure
8. **Azure OpenAI** streams response back through the stack
9. **Response** delivered as stream chunks to user

### 🔑 Key Components

- **ManagedIdentity Credential**: Production authentication (no keys required)
- **AzureCli Credential**: Development authentication (uses `az login`)
- **Bearer Token Provider**: Converts Azure credentials to OpenAI bearer tokens
- **Native Stream Adapter**: Handles native OpenAI event streaming and error handling
- **Native Azure OpenAI Client**: Direct API integration with credential selection, model caching, and token initialization

### 📝 Configuration

All settings managed via `~/.clawdbot/clawdbot.json`:
- Auth profiles (including `managedidentity`)
- Model provider configurations
- Agent defaults
