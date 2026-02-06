# Clawdbot Vector Database: Complete Setup & Use Case Guide

> A practical, step-by-step guide to setting up and using Clawdbot's vector database for intelligent memory search.

## Table of Contents

1. [What is the Vector Database?](#what-is-the-vector-database)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Use Case 1: Personal Knowledge Base](#use-case-1-personal-knowledge-base)
5. [Use Case 2: Project Documentation Memory](#use-case-2-project-documentation-memory)
6. [Use Case 3: Meeting Notes & Decisions](#use-case-3-meeting-notes--decisions)
7. [Use Case 4: Code Snippets & Solutions](#use-case-4-code-snippets--solutions)
8. [Advanced Usage](#advanced-usage)
9. [Troubleshooting](#troubleshooting)
10. [Performance Tips](#performance-tips)

---

## What is the Vector Database?

Clawdbot's vector database (memory system) allows the AI agent to remember and search through your notes, documentation, and conversations using **semantic search**. Unlike traditional keyword search, vector search understands the *meaning* of your queries.

### Key Features

- **100% Local & Private**: All data stays on your machine
- **No API Keys Required**: Uses local embedding models
- **Semantic Search**: Finds relevant content based on meaning, not just keywords
- **Hybrid Search**: Combines vector similarity with traditional text search (BM25)
- **Auto-Indexing**: Watches files and updates the index automatically

### Architecture

```
┌─────────────────┐
│  Memory Files   │  ~/clawd/memory/*.md, MEMORY.md
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Chunking       │  Split into ~400 token chunks with 80 token overlap
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Embeddings     │  Convert text to 768-dim vectors (embeddinggemma-300M)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Index   │  SQLite + sqlite-vec extension
│  + FTS5 Index   │  ~/.clawdbot/memory/main.sqlite
└─────────────────┘
```

---

## Prerequisites

### System Requirements

- **Node.js**: 22.12.0 or higher
- **Disk Space**: ~600MB (329MB model + index overhead)
- **RAM**: ~1GB when model is loaded
- **OS**: macOS, Linux, or Windows with WSL

### Check Your Node Version

```bash
node --version
# Should output: v22.12.0 or higher
```

If you need to upgrade:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Using nvm
nvm install 22
nvm use 22
```
Mac:clawdbot ghu$ nvm install 22
Downloading and installing node v22.22.0...
Downloading https://nodejs.org/dist/v22.22.0/node-v22.22.0-darwin-arm64.tar.xz...
########################################################################################################################################################## 100.0%
Computing checksum with sha256sum
Checksums matched!
Now using node v22.22.0 (npm v10.9.4)
Creating default alias: default -> 22 (-> v22.22.0)
Mac:clawdbot ghu$ nvm use 22
Now using node v22.22.0 (npm v10.9.4)
---

## Step-by-Step Setup

### Step 1: Configure Local Embeddings Provider

Edit your Clawdbot configuration file:

```bash
# Open configuration
nano ~/.clawdbot/clawdbot.json
```

Add or update the `memorySearch` configuration:

```json
{
  "agents": {
    "defaults": {
      "workspace": "/Users/youruser/clawd",
      "memorySearch": {
        "provider": "local",
        "fallback": "none"
      }
    }
  }
}
```

**Configuration Explained:**
- `provider: "local"` - Use local embedding model (no API)
- `fallback: "none"` - Don't fallback to cloud providers if local fails

**✓ Verification:**
```bash
cat ~/.clawdbot/clawdbot.json | grep -A 5 memorySearch
```

Expected output should show your configuration.

---

### Step 2: Approve Native Builds

The local embedding model requires native bindings compilation for `node-llama-cpp`.

```bash
# Navigate to your clawdbot directory
cd ~/aiworker/clawdbot  # Adjust to your path

# Create approval file
echo '{"node-llama-cpp": true}' > .pnpm-approvals.json


cat .pnpm-approvals.json | grep -A 5  node-llama-cpp

# Rebuild native bindings
pnpm rebuild node-llama-cpp
```

**✓ Verification:**
```bash
# Check if native bindings exist
ls -lh node_modules/.pnpm/node-llama-cpp*/node_modules/@node-llama-cpp/*/llamaBins/
```

You should see platform-specific binaries.

---

### Step 3: Create Workspace & Memory Directories

```bash
# Create workspace directory (if not exists)
mkdir -p ~/clawd

# Create memory subdirectory
mkdir -p ~/clawd/memory
```

**✓ Verification:**
```bash
ls -la ~/clawd/
# Should show: memory/ directory
```

---

### Step 4: Initial Test - Download Model

The first time you run memory commands, the embedding model will be downloaded (~329MB).

```bash
clawdbot memory status
```

**Expected Output (First Run):**
```
Downloading model...
Progress: [==============>     ] 65% (214MB / 329MB)
```

**After Download Completes:**
```
Memory Search (main)
Provider: local (requested: local)
Model: hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf
Sources: memory
Indexed: 0/0 files · 0 chunks
Vector: ready
Vector dims: 768
FTS: ready
```

**✓ Verification:**
```bash
# Check model was downloaded
ls -lh ~/.node-llama-cpp/models/
# Should show: hf_ggml-org_embeddinggemma-300M-Q8_0.gguf (~329MB)
```

```sh
pnpm clawdbot memory status

> clawdbot@2026.1.25 clawdbot /Users/ghu/aiworker/clawdbot
> node scripts/run-node.mjs memory status


🦞 Clawdbot 2026.1.25 (20f6a55) — iMessage green bubble energy, but for everyone.

Memory Search (main)
Provider: local (requested: local)
Model: hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf
Sources: memory
Indexed: 1/1 files · 1 chunks
Dirty: yes
Store: ~/.clawdbot/memory/main.sqlite
Workspace: ~/clawd
By source:
  memory · 1/1 files · 1 chunks
Vector: ready
Vector dims: 768
Vector path: ~/aiworker/clawdbot/node_modules/.pnpm/sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec-darwin-arm64/vec0.dylib
FTS: ready
Embedding cache: enabled (1 entries)
Batch: disabled (failures 0/2)

Mac:clawdbot ghu$ ls -lh ~/.node-llama-cpp/models/
total 641752
-rw-r--r--@ 1 ghu  staff   313M Jan 31 11:53 hf_ggml-org_embeddinggemma-300M-Q8_0.gguf
```
**✓ Vector Extension Check:**
```bash
clawdbot memory status | grep "Vector:"
# Should output: Vector: ready
```

If you see `Vector: unavailable`, see the [Troubleshooting](#troubleshooting) section.

---

### Step 5: Create Your First Memory File

```bash
# Create today's daily log
cat > ~/clawd/memory/$(date +%Y-%m-%d).md << 'EOF'
# Daily Log

## Setup Notes
- Configured Clawdbot vector database with local embeddings
- Model: embeddinggemma-300M (768 dimensions)
- No API keys required - fully private and offline
- Vector search: ready
- Full-text search: ready

## Key Features Learned
- Semantic search understands meaning, not just keywords
- Hybrid search combines vector + text matching
- Auto-indexing watches files and updates automatically
- All data stays local on my machine

## Next Steps
- Create practical use cases for memory
- Test semantic search capabilities
- Document project-specific knowledge
EOF
```

**✓ Verification:**
```bash
cat ~/clawd/memory/$(date +%Y-%m-%d).md
# Should display the content you just created
```

---

### Step 6: Index Your Memory Files

```bash
clawdbot memory index
```
```sh
pnpm clawdbot memory index

> clawdbot@2026.1.25 clawdbot /Users/ghu/aiworker/clawdbot
> node scripts/run-node.mjs memory index


🦞 Clawdbot 2026.1.25 (20f6a55) — I'm the assistant your terminal demanded, not the one your sleep schedule requested.

│
◇  
Memory index updated (main).
```

**Expected Output:**
```
Memory index updated (main).
```

**✓ Verification:**
```bash
clawdbot memory status
```

**Expected Output:**
```
Memory Search (main)
Provider: local (requested: local)
Model: hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf
Sources: memory
Indexed: 1/1 files · 1 chunks
Dirty: no
Store: ~/.clawdbot/memory/main.sqlite
Workspace: ~/clawd
By source:
  memory · 1/1 files · 1 chunks
Vector: ready
Vector dims: 768
Vector path: ~/aiworker/clawdbot/node_modules/.pnpm/sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec-darwin-arm64/vec0.dylib
FTS: ready
Embedding cache: enabled (1 entries)
```

**Key Indicators:**
- `Indexed: 1/1 files` ✅
- `Vector: ready` ✅
- `FTS: ready` ✅
- `Dirty: no` ✅

---
'''sh vec semantic search
What does sqlite-vec do?

sqlite-vec is a SQLite extension that adds vector search support.

In simple terms, it lets SQLite:
	•	Store vector embeddings (e.g. AI embeddings)
	•	Perform similarity search (cosine / dot / L2)
	•	Act like a lightweight vector database

This is commonly used for:
	•	AI agents
	•	RAG (Retrieval-Augmented Generation)
	•	Local semantic search
	•	Fast prototyping without running Milvus / Pinecone / FAISS

⸻

What is vec0.dylib specifically?

vec0.dylib is the native C extension that:
	•	Implements vector math (SIMD-optimized)
	•	Registers SQLite functions like:
	•	vec_distance()
	•	vec_top_k()
'''
### Step 7: Test Semantic Search

```bash
clawdbot memory search "how do I configure private local search?"
```


```shell
  522  ./vector-add-daily-log.sh 
  523  cat ~/clawd/memory/$(date +%Y-%m-%d).md
  524  pnpm clawdbot memory index
  525  pnpm clawdbot memory status
  526  grep -R "load_extension" ~/aiworker/clawdbot
  527  pnpm clawdbot memory search "how do I configure private local search?"
  528  memory search 'how do I configure private local search?'
  529  pnpm clawdbot memory search "how do I configure private local search?"
```
**Expected Output:**
```
0.782 memory/2026-02-01.md:1-12
# Daily Log

## Setup Notes
- Configured Clawdbot vector database with local embeddings
- Model: embeddinggemma-300M (768 dimensions)
- No API keys required - fully private and offline
...
```

Notice how the search found relevant content even though you didn't use the exact words "vector database" or "embeddings" in your query!

**✓ Verification - Test Different Queries:**

```bash
# Semantic query (meaning-based)
clawdbot memory search "privacy and data storage"
# Should find: "fully private and offline", "stays local"

# Keyword query (exact match)
clawdbot memory search "embeddinggemma-300M"
# Should find: exact model name

# Hybrid query (combination)
clawdbot memory search "setup configuration steps"
# Should find: setup notes and configuration details
```

---

## Use Case 1: Personal Knowledge Base

### Scenario
You want to maintain a personal knowledge base of technical concepts, tools, and solutions you learn over time.

### Setup

```bash
# Create long-term memory file
cat > ~/clawd/MEMORY.md << 'EOF'
# Personal Knowledge Base

## Programming Languages

### TypeScript
- Prefer strict type checking: `"strict": true` in tsconfig.json
- Use type guards for runtime type safety
- Avoid `any` type - use `unknown` when type is truly unknown
- Interface vs Type: Use interfaces for objects, types for unions/intersections

### Python
- Virtual environments: Always use `venv` or `conda`
- Type hints: Use `typing` module for better IDE support
- f-strings preferred over `.format()` or `%` formatting
- Black formatter: Line length 88 characters

## Tools & Commands

### Git Workflows
- Branch naming: `feature/`, `bugfix/`, `hotfix/` prefixes
- Commit messages: Follow Conventional Commits (feat:, fix:, docs:, etc.)
- Rebase vs Merge: Prefer rebase for feature branches, merge for releases

### Docker Best Practices
- Multi-stage builds reduce image size
- Use `.dockerignore` to exclude unnecessary files
- Alpine images are smaller but may have compatibility issues
- Health checks: Always add HEALTHCHECK instructions

## Problem Solutions

### SSL Certificate Errors
**Problem**: `CERT_HAS_EXPIRED` or `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
**Solution**:
```bash
# macOS: Update certificates
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain cert.pem

# Node.js: Disable strict SSL (development only)
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Database Connection Timeouts
**Problem**: Connection pool exhausted
**Solution**:
- Increase pool size: `max_connections = 200` (PostgreSQL)
- Add connection timeout: `connect_timeout = 10`
- Use connection pooling library (pg-pool, mysql2)
- Monitor active connections: `SELECT * FROM pg_stat_activity;`

## Learning Resources

### Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Clean Code" by Robert C. Martin
- "The Pragmatic Programmer" by Hunt & Thomas

### Online Courses
- System Design: educative.io/system-design-interview
- Algorithms: leetcode.com, hackerrank.com
- Cloud Certifications: AWS SAA, GCP Associate

## Personal Preferences

### Development Environment
- Editor: VSCode with extensions (ESLint, Prettier, GitLens)
- Terminal: iTerm2 with Oh My Zsh
- Theme: Dracula Pro
- Font: JetBrains Mono with ligatures

### Code Style
- Prefer explicit over implicit
- Early returns over nested conditionals
- Small, focused functions (< 50 lines)
- Meaningful variable names (no single letters except loops)
EOF
```

### Index the Knowledge Base

```bash
clawdbot memory index
```

**✓ Verification:**
```bash
clawdbot memory status
# Should show: Indexed: 2/2 files (daily log + MEMORY.md)
```

### Test Knowledge Retrieval

```bash
# Test 1: Find TypeScript best practices
clawdbot memory search "typescript configuration recommendations"
```

**Expected Result**: Should return TypeScript preferences section

```bash
# Test 2: Find solution to SSL problems
clawdbot memory search "certificate errors ssl"
```

**Expected Result**: Should return SSL Certificate Errors solution

```bash
# Test 3: Find Docker tips
clawdbot memory search "container image optimization"
```

**Expected Result**: Should return Docker best practices

```bash
# Test 4: Find development tools
clawdbot memory search "what editor do I use?"
```

**Expected Result**: Should return development environment preferences

### Using with AI Agent

Now when you chat with the Clawdbot agent, it will automatically search and retrieve relevant knowledge:

```bash
clawdbot agent --message "What's my preferred way to handle TypeScript types?" --deliver
```

The agent will search your memory and respond based on your documented preferences.

---

## Use Case 2: Project Documentation Memory

### Scenario
You're working on multiple projects and want the agent to remember project-specific details, architecture decisions, and implementation notes.

### Setup

```bash
# Create project-specific memory entry in MEMORY.md
cat >> ~/clawd/MEMORY.md << 'EOF'

## Project: E-Commerce Platform

### Architecture Overview
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis for session storage and API caching
- **Search**: Elasticsearch for product search
- **Queue**: RabbitMQ for order processing

### Key Design Decisions

#### Authentication (2026-01-15)
- Using JWT with refresh tokens
- Access token: 15 min expiry
- Refresh token: 7 days, stored in httpOnly cookie
- Redis for token blacklist (logout)

#### Payment Processing (2026-01-20)
- Stripe as primary payment gateway
- PayPal as secondary option
- Webhook handling: Idempotency keys required
- Payment status: pending → processing → completed/failed
- Retry logic: 3 attempts with exponential backoff

#### Product Catalog (2026-01-25)
- Categories: Hierarchical structure (max 3 levels)
- Variants: Size, color stored as separate SKUs
- Inventory: Real-time sync with warehouse system
- Images: S3 storage with CloudFront CDN

### API Endpoints

#### User Management
- POST `/api/auth/register` - Create new account
- POST `/api/auth/login` - Authenticate user
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Invalidate tokens
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update profile

#### Products
- GET `/api/products` - List products (pagination, filters)
- GET `/api/products/:id` - Get product details
- GET `/api/products/search` - Search products (Elasticsearch)
- GET `/api/categories` - List categories tree

#### Orders
- POST `/api/orders` - Create order
- GET `/api/orders` - List user orders
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id/cancel` - Cancel order

### Known Issues

#### Issue #127: Race Condition in Inventory
**Problem**: Multiple concurrent orders can oversell inventory
**Workaround**: Added database-level constraint + optimistic locking
**Status**: Fixed in v2.1.0

#### Issue #203: Slow Product Search
**Problem**: Elasticsearch queries timing out for complex filters
**Solution**: Added query caching + simplified filter logic
**Status**: Monitoring performance

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...

# Storage
AWS_REGION=us-east-1
S3_BUCKET=ecommerce-assets
CLOUDFRONT_DOMAIN=d123456.cloudfront.net

# Search
ELASTICSEARCH_URL=http://localhost:9200
```

### Deployment
- **Production**: AWS ECS Fargate
- **Staging**: Heroku (auto-deploy from `develop` branch)
- **CI/CD**: GitHub Actions
- **Monitoring**: Datadog + Sentry

EOF
```

### Index the Update

```bash
clawdbot memory index
```

### Test Project-Specific Queries

```bash
# Architecture questions
clawdbot memory search "what database are we using for the ecommerce project?"

# Implementation details
clawdbot memory search "how do we handle payment processing?"

# API endpoints
clawdbot memory search "API endpoint to create an order"

# Issues and solutions
clawdbot memory search "inventory overselling problem"

# Configuration
clawdbot memory search "stripe webhook configuration"
```

### Real-World Agent Usage

```bash
# Ask the agent about your project
clawdbot agent --message "Remind me how we implemented authentication in the e-commerce project" --deliver

# Get implementation guidance
clawdbot agent --message "I need to add a new product variant. What's the data structure we're using?" --deliver

# Troubleshooting help
clawdbot agent --message "We're seeing slow search queries. What was the solution we implemented?" --deliver
```

The agent will search your memory and provide accurate, context-aware responses based on your documented project details.

---

## Use Case 3: Meeting Notes & Decisions

### Scenario
Track meeting notes, decisions, and action items so the agent can help you remember what was discussed and decided.

### Daily Log Structure

```bash
# Create today's meeting notes
cat > ~/clawd/memory/$(date +%Y-%m-%d).md << 'EOF'
# Daily Log - 2026-02-01

## Morning Standup (9:00 AM)

### Team Updates
- **Alice**: Finished user profile redesign, starting on notification system
- **Bob**: Fixed critical bug in payment flow (Issue #245), deploying to staging
- **Carol**: Working on Elasticsearch optimization, reduced query time by 40%

### Blockers
- Bob: Waiting for Stripe webhook testing credentials
- Carol: Need access to production logs for performance analysis

### Action Items
- [ ] Alice: Create tickets for notification system features (by EOD)
- [ ] Bob: Follow up with finance team about Stripe test account
- [ ] Carol: Request log access from DevOps (Slack @john)

## Architecture Review Meeting (2:00 PM)

### Attendees
- Engineering: Alice, Bob, Carol, David (Tech Lead)
- Product: Emily (PM)
- Design: Frank (Lead Designer)

### Agenda
1. Review new microservices proposal
2. Discuss database migration strategy
3. Performance optimization priorities

### Discussion Notes

#### Microservices Proposal
**Current State**: Monolithic Node.js application
**Proposed**: Split into 3 services:
1. **User Service**: Authentication, profiles, preferences
2. **Product Service**: Catalog, inventory, search
3. **Order Service**: Cart, checkout, payments, fulfillment

**Pros**:
- Better separation of concerns
- Independent scaling
- Easier to maintain and test
- Team can work independently on services

**Cons**:
- Increased operational complexity
- Need service mesh (considering Istio)
- Distributed transactions complexity
- Development environment setup more complex

**Decision**: ✅ **Approved** - Start with User Service extraction
- Timeline: Q1 2026 (3 months)
- Bob will lead the User Service extraction
- David to create detailed migration plan by Feb 15

#### Database Migration Strategy
**Problem**: Current PostgreSQL instance hitting performance limits
**Options Discussed**:
1. **Vertical Scaling**: Upgrade to larger RDS instance
   - Cost: ~$2000/month
   - Pros: Quick, low risk
   - Cons: Limited long-term scalability

2. **Read Replicas**: Add 2 read replicas
   - Cost: ~$3000/month
   - Pros: Improves read performance
   - Cons: Doesn't help write-heavy workloads

3. **Sharding**: Partition data by user_id
   - Cost: Similar to current
   - Pros: Linear scalability
   - Cons: Complex implementation, hard to revert

**Decision**: ✅ **Hybrid Approach**
- Phase 1 (Feb): Add 2 read replicas for immediate relief
- Phase 2 (Mar-Apr): Implement application-level read/write splitting
- Phase 3 (Q2): Evaluate sharding based on growth metrics
- Carol to lead database optimization effort

#### Performance Optimization Priorities
**Ranked by Impact**:
1. **Elasticsearch Query Optimization** (Carol)
   - Target: < 100ms p95 latency
   - ETA: 2 weeks

2. **API Response Caching** (Alice)
   - Redis caching for product listings
   - ETA: 1 week

3. **Image Optimization** (Frank)
   - WebP format conversion
   - Lazy loading implementation
   - ETA: 3 weeks

4. **Database Indexing Review** (Carol)
   - Analyze slow queries
   - Add missing indexes
   - ETA: 1 week

### Action Items
- [ ] David: Create User Service extraction plan (Due: Feb 15)
- [ ] Bob: Set up POC for service mesh (Due: Feb 10)
- [ ] Carol: Provision read replicas in staging (Due: Feb 5)
- [ ] Carol: Implement query splitting logic (Due: Feb 20)
- [ ] Alice: Design Redis caching strategy (Due: Feb 8)
- [ ] Frank: Research WebP conversion tools (Due: Feb 5)

### Open Questions
- Which service mesh? (Istio vs Linkerd)
- How to handle distributed tracing?
- Database migration window for replicas?

## One-on-One with Tech Lead (4:30 PM)

### Discussion Topics

#### Career Development
- Interested in Tech Lead track
- Need more experience with system architecture
- Goal: Lead a major project in 2026

**David's Feedback**:
- Strong technical skills, good code quality
- Need to improve: Documentation, mentoring juniors
- Opportunity: Lead the API caching implementation
- Recommendation: Present at next architecture review

**Action Plan**:
- [ ] Take ownership of Redis caching project
- [ ] Mentor new junior engineer starting next week
- [ ] Write architecture doc for caching strategy
- [ ] Present caching approach at March architecture review

#### Current Project: Notification System
**Scope**:
- Email notifications: Welcome, order status, promotions
- Push notifications: Mobile app
- In-app notifications: Bell icon with unread count
- SMS notifications (optional): Order shipping updates

**Technical Approach**:
- Queue-based architecture (RabbitMQ)
- Template system for emails (Handlebars)
- Provider abstraction layer:
  - Email: SendGrid (primary), AWS SES (backup)
  - Push: Firebase Cloud Messaging
  - SMS: Twilio

**Timeline**:
- Design doc: Feb 8
- Implementation: Feb 10 - Mar 5
- Testing: Mar 5 - Mar 12
- Launch: Mar 15

**Concerns**:
- Email deliverability rates
- Push notification opt-in rates
- Rate limiting to avoid spam

**David's Input**:
- Start with MVP: Email + Push only
- SMS can be Phase 2
- Focus on reliability over features
- Set up monitoring and alerting from day 1

## Evening Notes

### Technical Research

#### Service Mesh Comparison
Did research on Istio vs Linkerd:

**Istio**:
- Pros: Feature-rich, widely adopted, good documentation
- Cons: Complex setup, high resource usage, steep learning curve
- Best for: Large organizations, complex networking requirements

**Linkerd**:
- Pros: Lightweight, easy to set up, good for Kubernetes
- Cons: Fewer features, smaller community
- Best for: Smaller teams, simpler use cases

**Recommendation**: Start with Linkerd for simpler learning curve, migrate to Istio if needed

#### WebP Image Format
- ~30% smaller than JPEG at same quality
- Supported by all modern browsers (95% coverage)
- Fallback to JPEG for old browsers (< 5%)
- Tools: sharp (Node.js), imagemagick (CLI)

### Personal Notes
- Feeling good about career progression discussion
- Excited about notification system project
- Need to focus on documentation and mentoring
- Remember to follow up on action items

EOF
```

### Index the Meeting Notes

```bash
clawdbot memory index
```

### Test Meeting-Related Queries

```bash
# Find decisions
clawdbot memory search "microservices architecture decision"

# Find action items
clawdbot memory search "database read replicas action items"

# Find technical details
clawdbot memory search "notification system implementation approach"

# Find career notes
clawdbot memory search "career development feedback"

# Find research
clawdbot memory search "comparison between service mesh options"
```

### Using with Agent

```bash
# Recap meetings
clawdbot agent --message "What was decided in the architecture review meeting?" --deliver

# Check action items
clawdbot agent --message "What are my action items from today's meetings?" --deliver

# Technical guidance
clawdbot agent --message "How should we implement the notification system?" --deliver

# Career context
clawdbot agent --message "What feedback did I get about my career development?" --deliver
```

---

## Use Case 4: Code Snippets & Solutions

### Scenario
Save reusable code snippets and solutions to common problems for quick reference.

### Setup

```bash
cat >> ~/clawd/MEMORY.md << 'EOF'

## Code Snippets Library

### TypeScript Utilities

#### Retry Function with Exponential Backoff
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Should never reach here');
}

// Usage
const result = await retryWithBackoff(
  async () => fetch('https://api.example.com/data'),
  3,
  1000
);
```

#### Type-Safe Event Emitter
```typescript
type EventMap = {
  'user:login': { userId: string; timestamp: Date };
  'user:logout': { userId: string };
  'order:created': { orderId: string; amount: number };
};

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: Map<keyof T, Set<(data: any) => void>> = new Map();

  on<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
}

// Usage
const emitter = new TypedEventEmitter<EventMap>();
emitter.on('user:login', (data) => {
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});
```

#### Debounce Hook (React)
```typescript
import { useEffect, useState } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // API call here
      console.log('Searching for:', debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
}
```

### Database Patterns

#### Transaction Wrapper (Prisma)
```typescript
import { PrismaClient } from '@prisma/client';

async function withTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    try {
      const result = await callback(tx);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
}

// Usage
await withTransaction(prisma, async (tx) => {
  const order = await tx.order.create({
    data: { userId: '123', total: 100 }
  });

  await tx.inventory.update({
    where: { productId: 'abc' },
    data: { quantity: { decrement: 1 } }
  });

  return order;
});
```

#### Connection Pool Health Check
```typescript
import { Pool } from 'pg';

async function checkDatabaseHealth(pool: Pool): Promise<{
  healthy: boolean;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    return {
      healthy: true,
      activeConnections: pool.totalCount - pool.idleCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
    };
  } catch (error) {
    return {
      healthy: false,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
    };
  }
}
```

### API Patterns

#### Rate Limiter Middleware (Express)
```typescript
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis();

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (req: Request) => string;
}

function rateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator = (req) => req.ip } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate-limit:${keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const requestCount = await redis.zcard(key);

      if (requestCount >= maxRequests) {
        res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: windowMs / 1000,
        });
        return;
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(windowMs / 1000));

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next(); // Fail open
    }
  };
}

// Usage
app.use('/api', rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
}));
```

#### API Response Wrapper
```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
};

function successResponse<T>(data: T, requestId: string): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

function errorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string
): ApiResponse<never> {
  return {
    success: false,
    error: { code, message, details },
    meta: requestId
      ? { timestamp: new Date().toISOString(), requestId }
      : undefined,
  };
}

// Usage
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(successResponse(user, req.id));
  } catch (error) {
    res.status(500).json(
      errorResponse('USER_FETCH_ERROR', 'Failed to fetch user', error, req.id)
    );
  }
});
```

### Testing Utilities

#### Mock Factory Pattern
```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function createMock<T>(defaults: T) {
  return (overrides?: DeepPartial<T>): T => {
    return { ...defaults, ...overrides } as T;
  };
}

// Usage
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

const mockUser = createMock<User>({
  id: 'default-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2026-01-01'),
});

// In tests
const user1 = mockUser(); // Uses all defaults
const user2 = mockUser({ email: 'custom@example.com' }); // Override email
const user3 = mockUser({ name: 'Alice', id: '123' }); // Override multiple
```

#### Async Test Helper
```typescript
import { expect, test } from 'vitest';

async function expectAsync<T>(
  promise: Promise<T>
): Promise<{
  toResolve: () => Promise<void>;
  toReject: () => Promise<void>;
  toResolveWith: (expected: T) => Promise<void>;
  toRejectWith: (error: any) => Promise<void>;
}> {
  return {
    async toResolve() {
      await expect(promise).resolves.toBeDefined();
    },
    async toReject() {
      await expect(promise).rejects.toThrow();
    },
    async toResolveWith(expected: T) {
      await expect(promise).resolves.toEqual(expected);
    },
    async toRejectWith(error: any) {
      await expect(promise).rejects.toEqual(error);
    },
  };
}

// Usage
test('API call succeeds', async () => {
  const promise = fetchUser('123');
  await expectAsync(promise).toResolveWith({ id: '123', name: 'Alice' });
});

test('API call fails', async () => {
  const promise = fetchUser('invalid');
  await expectAsync(promise).toReject();
});
```

EOF
```

### Index the Snippets

```bash
clawdbot memory index
```

### Test Code Snippet Retrieval

```bash
# Find retry logic
clawdbot memory search "retry with exponential backoff implementation"

# Find React hooks
clawdbot memory search "debounce hook react"

# Find database patterns
clawdbot memory search "database transaction wrapper"

# Find API patterns
clawdbot memory search "rate limiting middleware"

# Find testing utilities
clawdbot memory search "mock factory pattern testing"
```

### Using with Agent for Code Generation

```bash
# Get retry implementation
clawdbot agent --message "Show me the retry with backoff implementation from my snippets" --deliver

# Get rate limiter
clawdbot agent --message "I need to add rate limiting to my API. What's the pattern I saved?" --deliver

# Get testing helper
clawdbot agent --message "How do I create mocks for testing? Show me the factory pattern" --deliver
```

---

## Advanced Usage

### Hybrid Search Configuration

You can customize the balance between vector (semantic) and text (keyword) search:

```bash
# Edit config
nano ~/.clawdbot/clawdbot.json
```

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "query": {
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3,
            "candidateMultiplier": 4
          }
        }
      }
    }
  }
}
```

**Configuration Explained:**
- `vectorWeight: 0.7` - 70% weight to semantic similarity
- `textWeight: 0.3` - 30% weight to keyword matching
- `candidateMultiplier: 4` - Fetch 4× candidates before merging results

**Use Cases:**
- **High vectorWeight (0.8+)**: Best for conceptual queries ("how do I...")
- **High textWeight (0.5+)**: Best for specific terms (error codes, function names)
- **Balanced (0.5/0.5)**: Best for general-purpose search

### Session Memory (Experimental)

Index conversation history in addition to memory files:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "sources": ["memory", "sessions"],
        "experimental": {
          "sessionMemory": true
        }
      }
    }
  }
}
```

**Warning**: This can significantly increase index size. Use only if needed.

### Custom Embedding Model

Use a different GGUF model:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "local": {
          "modelPath": "/path/to/custom-model.gguf"
        }
      }
    }
  }
}
```

### Batch Indexing Options

Control indexing behavior:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "indexing": {
          "chunkSize": 400,
          "chunkOverlap": 80,
          "autoIndex": true,
          "watchDebounceMs": 1500
        }
      }
    }
  }
}
```

---

## Troubleshooting

### Issue: Vector Database Unavailable

**Symptoms:**
```
Vector: unavailable
Vector error: params.db.enableLoadExtension is not a function
```

**Root Cause:**
This error occurs when using Node.js built-in `node:sqlite` which doesn't have the `enableLoadExtension()` method (only `better-sqlite3` has it).

**Solution:**
This should be fixed in the latest version. The fix checks if the method exists before calling it.

**Verification:**
```bash
# Check if fix is applied
grep -A 5 "enableLoadExtension" src/memory/sqlite-vec.ts
```

Expected output should show:
```typescript
if (typeof (params.db as any).enableLoadExtension === "function") {
  (params.db as any).enableLoadExtension(true);
}
```

If not present:
```bash
cd ~/aiworker/clawdbot
git pull
pnpm build
clawdbot memory status
```

---

### Issue: Model Download Fails

**Symptoms:**
```
Error downloading model
Network timeout
```

**Solutions:**

1. **Check disk space:**
```bash
df -h ~
# Need at least 600MB free
```

2. **Check internet connection:**
```bash
curl -I https://huggingface.co
```

3. **Retry download:**
```bash
clawdbot memory index
# Downloads resume automatically
```

4. **Manual download (if needed):**
```bash
mkdir -p ~/.node-llama-cpp/models/
cd ~/.node-llama-cpp/models/
curl -L -o hf_ggml-org_embeddinggemma-300M-Q8_0.gguf \
  https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf
```

---

### Issue: Search Returns No Results

**Symptoms:**
```bash
clawdbot memory search "query"
# No results returned
```

**Possible Causes & Solutions:**

1. **Files not indexed:**
```bash
clawdbot memory status
# Check: Indexed: 0/0 files
```

**Solution:**
```bash
clawdbot memory index
```

2. **Files in wrong location:**
```bash
# Check workspace path
clawdbot memory status | grep Workspace
# Verify files exist
ls -la ~/clawd/memory/
```

3. **Query too specific:**
```bash
# Try broader query
clawdbot memory search "setup"  # Instead of "exact phrase setup"
```

4. **Index corruption:**
```bash
# Rebuild index
rm ~/.clawdbot/memory/main.sqlite
clawdbot memory index
```

---

### Issue: High Memory Usage

**Symptoms:**
- System slowdown when using memory search
- Process using 1GB+ RAM

**Root Cause:**
Embedding model loaded in memory (~600MB).

**Solutions:**

1. **Close unused terminals:**
Each terminal with clawdbot loaded keeps model in memory.

2. **Use remote embeddings for lower memory:**
```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "openai",
        "remote": {
          "apiKey": "sk-..."
        }
      }
    }
  }
}
```

Trade-off: Privacy (sends data to OpenAI) vs Memory usage.

---

### Issue: Slow Search Performance

**Symptoms:**
Search queries take > 2 seconds.

**Solutions:**

1. **First query after startup is always slow (model loading):**
```bash
# Warm up
clawdbot memory search "test" > /dev/null
# Subsequent queries will be fast
```

2. **Too many indexed files:**
```bash
clawdbot memory status
# Check: Indexed: 1000+ files
```

**Solution:** Reduce number of files or increase chunk size:
```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "indexing": {
          "chunkSize": 600  // Larger chunks = fewer embeddings
        }
      }
    }
  }
}
```

3. **Enable query caching (not implemented yet):**
Currently, every search generates embeddings. Future versions will cache.

---

### Issue: "Dirty" Status Won't Clear

**Symptoms:**
```
Dirty: yes
```

Even after running `clawdbot memory index`.

**Cause:**
Files changed after indexing, or watcher not detecting changes.

**Solution:**
```bash
# Force reindex
clawdbot memory index --force

# Check status
clawdbot memory status
# Should now show: Dirty: no
```

---

## Performance Tips

### 1. Optimize Memory File Structure

**❌ Bad:**
```markdown
# Single massive file (10,000+ lines)
All information in one MEMORY.md file
```

**✅ Good:**
```markdown
# Organized by topic
MEMORY.md (1,000 lines) - Long-term facts
memory/2026-02-01.md (500 lines) - Daily notes
memory/2026-01-31.md (500 lines) - Yesterday
```

### 2. Use Descriptive Headings

**❌ Bad:**
```markdown
## Notes
- Something about databases
- API stuff
```

**✅ Good:**
```markdown
## Database Performance Optimization
- PostgreSQL read replicas configuration
- Query optimization strategies

## API Design Patterns
- RESTful endpoint conventions
- Error handling best practices
```

Reason: Headings provide context for chunking and improve search relevance.

### 3. Include Keywords

Add relevant keywords to improve hybrid search:

```markdown
## TypeScript Configuration

Tags: #typescript #tsconfig #strict-mode #compiler-options

Prefer strict type checking with the following tsconfig.json settings:
...
```

### 4. Regular Cleanup

Remove outdated information:

```bash
# Archive old daily logs
mkdir -p ~/clawd/memory/archive/2025
mv ~/clawd/memory/2025-*.md ~/clawd/memory/archive/2025/

# Reindex after cleanup
clawdbot memory index
```

### 5. Batch Operations

When adding multiple files:

```bash
# Add all files first
cat > ~/clawd/memory/file1.md << 'EOF'
...
EOF

cat > ~/clawd/memory/file2.md << 'EOF'
...
EOF

cat > ~/clawd/memory/file3.md << 'EOF'
...
EOF

# Then index once
clawdbot memory index
```

Don't index after each file creation.

### 6. Monitor Index Size

```bash
# Check index file size
ls -lh ~/.clawdbot/memory/main.sqlite

# If > 100MB, consider:
# - Archiving old content
# - Reducing chunk overlap
# - Increasing chunk size
```

---

## Summary Checklist

### Initial Setup
- [ ] Node.js 22+ installed
- [ ] Configure `~/.clawdbot/clawdbot.json` with local provider
- [ ] Approve `node-llama-cpp` native builds
- [ ] Create `~/clawd/memory/` directory
- [ ] Run `clawdbot memory status` (downloads model)
- [ ] Verify "Vector: ready"

### Daily Usage
- [ ] Add daily log: `~/clawd/memory/YYYY-MM-DD.md`
- [ ] Update long-term memory: `~/clawd/MEMORY.md`
- [ ] Index changes: `clawdbot memory index` (or wait for auto-index)
- [ ] Search memory: `clawdbot memory search "query"`
- [ ] Check status: `clawdbot memory status`

### Best Practices
- [ ] Use descriptive headings
- [ ] Organize by topic
- [ ] Include keywords/tags
- [ ] Keep files under 2000 lines
- [ ] Archive old content regularly
- [ ] Verify index after major changes

### Troubleshooting
- [ ] Check "Vector: ready" status
- [ ] Verify files in correct location
- [ ] Ensure index is up-to-date (`Dirty: no`)
- [ ] Test with simple queries first
- [ ] Check disk space if issues persist

---

## Next Steps

1. **Create your first memory files** based on Use Case examples
2. **Test semantic search** with various queries
3. **Integrate with AI agent** for context-aware responses
4. **Set up regular maintenance** (archive old files monthly)
5. **Explore advanced features** (hybrid search tuning, custom models)

## Resources

- **Official Docs**: https://docs.clawd.bot/concepts/memory
- **CLI Reference**: https://docs.clawd.bot/cli/memory
- **GitHub Issues**: https://github.com/clawdbot/clawdbot/issues
- **Model Details**: https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF

---

**Happy Memory Searching! 🚀**
