#!/usr/bin/env python3
"""
Generate high-quality Clawdbot LLM Run Engine architecture diagram
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.lines as mlines

# Set up high-quality figure
plt.figure(figsize=(20, 14), dpi=300)
ax = plt.gca()
ax.set_xlim(0, 20)
ax.set_ylim(0, 14)
ax.axis('off')

# Color palette
COLOR_BLUE = '#1e40af'
COLOR_LIGHT_BLUE = '#dbeafe'
COLOR_YELLOW = '#f59e0b'
COLOR_LIGHT_YELLOW = '#fef3c7'
COLOR_GREEN = '#10b981'
COLOR_LIGHT_GREEN = '#d1fae5'
COLOR_PURPLE = '#8b5cf6'
COLOR_LIGHT_PURPLE = '#ede9fe'
COLOR_RED = '#ef4444'
COLOR_LIGHT_RED = '#fee2e2'
COLOR_INDIGO = '#6366f1'
COLOR_LIGHT_INDIGO = '#e0e7ff'

def create_box(x, y, width, height, label, details, color, edge_color, linewidth=2):
    """Create a rounded box with title and details"""
    box = FancyBboxPatch(
        (x, y), width, height,
        boxstyle="round,pad=0.1",
        linewidth=linewidth,
        edgecolor=edge_color,
        facecolor=color,
        zorder=1
    )
    ax.add_patch(box)

    # Add title
    ax.text(
        x + width/2, y + height - 0.3,
        label,
        ha='center', va='top',
        fontsize=12, fontweight='bold',
        color=edge_color
    )

    # Add details
    y_offset = y + height - 0.7
    for line in details:
        ax.text(
            x + 0.15, y_offset,
            line,
            ha='left', va='top',
            fontsize=9,
            color='#374151'
        )
        y_offset -= 0.25

def create_arrow(x1, y1, x2, y2, color='#3b82f6', style='solid', linewidth=2):
    """Create an arrow between two points"""
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle='->,head_width=0.3,head_length=0.3',
        color=color,
        linewidth=linewidth,
        linestyle=style,
        zorder=2
    )
    ax.add_patch(arrow)

# Title
ax.text(10, 13.5, 'Clawdbot LLM Run Engine Architecture',
        ha='center', va='center', fontsize=20, fontweight='bold', color=COLOR_BLUE)

# Column 1: Main Flow
# Entry Point
create_box(0.5, 11, 3.5, 1.8,
    'Entry Point',
    ['runEmbeddedPiAgent()',
     '',
     '• Lane Queueing',
     '• Workspace Resolution',
     '• Config Loading',
     '• Model Registry Init'],
    COLOR_LIGHT_BLUE, COLOR_BLUE)

create_arrow(2.25, 11, 2.25, 9.7)

# Model & Auth Resolution
create_box(0.5, 7.5, 3.5, 2.2,
    'Model & Auth Resolution',
    ['• resolveModel()',
     '• Context Window Guard',
     '  - Warn: 8k tokens',
     '  - Min: 2k tokens',
     '• Auth Profile Store',
     '• Profile Order',
     '• Cooldown Tracking'],
    COLOR_LIGHT_BLUE, COLOR_BLUE)

create_arrow(2.25, 7.5, 2.25, 6.2)

# Main Execution Loop (highlighted)
create_box(0.5, 2.5, 3.5, 3.5,
    'Main Execution Loop',
    ['1. runEmbeddedAttempt()',
     '2. Success? → Build Payloads',
     '',
     '3. Error Classification:',
     '   • ContextOverflow',
     '     → Compact Session',
     '   • AuthError / RateLimit',
     '     → Rotate Profile',
     '   • FailoverError',
     '     → Model Fallback',
     '',
     '4. Retry or Throw'],
    COLOR_LIGHT_YELLOW, COLOR_YELLOW, linewidth=3)

create_arrow(2.25, 2.5, 2.25, 1.2)

# Result
create_box(0.5, 0.2, 3.5, 0.8,
    'Result',
    ['EmbeddedPiRunResult',
     '• Payloads • Meta • Usage'],
    COLOR_LIGHT_GREEN, COLOR_GREEN)

# Column 2: Detailed Components
# Attempt Execution
create_box(4.5, 8, 4.5, 4.5,
    'Attempt Execution',
    ['runEmbeddedAttempt()',
     '',
     'Initialization:',
     '• Session Write Lock',
     '• Load Session Manager',
     '• Build System Prompt',
     '• Load Workspace Skills',
     '• Resolve Sandbox Context',
     '',
     'History Processing:',
     '• Limit Turns (DM:100, else:30)',
     '• Sanitize for Provider',
     '• Validate Turn Order',
     '• Inject History Images',
     '',
     'Streaming & Execution:',
     '• Create Agent Session',
     '• Set Thinking Level',
     '• Stream LLM Response',
     '• Execute Tool Calls',
     '• Save Session State'],
    COLOR_LIGHT_PURPLE, COLOR_PURPLE)

# Session Compaction
create_box(4.5, 5.5, 4.5, 2.2,
    'Session Compaction',
    ['compactEmbeddedPiSessionDirect()',
     '',
     'Triggered on Context Overflow:',
     '• Load Session History',
     '• Calculate Token Budget',
     '• Generate Summary via LLM',
     '• Replace Old Turns',
     '• Save Compacted Session',
     '• Return Compaction Report'],
    COLOR_LIGHT_RED, COLOR_RED)

# Error Classification
create_box(4.5, 2.5, 4.5, 2.8,
    'Error Classification & Handlers',
    ['Error Types:',
     '• ContextOverflow → Compact',
     '• AuthError → Rotate Profile',
     '• RateLimitError → Cooldown',
     '• TimeoutError → Fallback',
     '• CompactionFailure → Failover',
     '• FailoverError → Model Fallback',
     '',
     'Failover Reasons:',
     'auth | rate_limit | timeout',
     'context_overflow | compaction_failure',
     'role_ordering | unknown'],
    COLOR_LIGHT_RED, COLOR_RED)

# Arrows from Loop to Components
create_arrow(4, 4.5, 4.5, 10, COLOR_PURPLE, 'dashed')
ax.text(4.2, 7.5, 'calls', ha='center', fontsize=8, color=COLOR_PURPLE)

create_arrow(4, 4, 4.5, 6.5, COLOR_RED, 'dashed')
ax.text(4.2, 5.2, 'triggers', ha='center', fontsize=8, color=COLOR_RED)

# Column 3: Features & Files
# Key Features
create_box(9.5, 7.5, 5, 5,
    'Key Features',
    ['1. Auth Profile Rotation',
     '   Multi-key failover on rate limit',
     '',
     '2. Context Window Management',
     '   Guard rails for insufficient context',
     '',
     '3. Automatic Compaction',
     '   Summarize old history on overflow',
     '',
     '4. Thinking Level Fallback',
     '   Reduce complexity on timeout',
     '',
     '5. Sandbox Integration',
     '   Isolated tool execution environments',
     '',
     '6. Lane Queueing',
     '   Session & global concurrency control',
     '',
     '7. Provider-Specific Handling',
     '   Google, Anthropic, Azure adaptations',
     '',
     '8. Cache Management',
     '   Prompt caching with TTL timestamps'],
    COLOR_LIGHT_GREEN, COLOR_GREEN)

# File Organization
create_box(9.5, 0.5, 5, 6.5,
    'File Organization',
    ['pi-embedded-runner/',
     '├─ run.ts',
     '│  Main orchestration & loop',
     '├─ run/',
     '│  ├─ attempt.ts',
     '│  │  Single attempt execution',
     '│  ├─ params.ts',
     '│  │  Parameter types',
     '│  ├─ payloads.ts',
     '│  │  Result building',
     '│  ├─ images.ts',
     '│  │  Image loading & injection',
     '│  └─ types.ts',
     '│     Attempt-specific types',
     '├─ compact.ts',
     '│  Session compaction logic',
     '├─ model.ts',
     '│  Model resolution',
     '├─ lanes.ts',
     '│  Queue lane management',
     '├─ abort.ts',
     '│  Abort signal handling',
     '├─ google.ts',
     '│  Google-specific adaptations',
     '└─ types.ts',
     '   Core type definitions'],
    COLOR_LIGHT_INDIGO, COLOR_INDIGO)

# Additional context boxes at bottom
# Auth Profile Flow
create_box(15, 7.5, 4.5, 5,
    'Auth Profile Rotation Flow',
    ['profileCandidates = [id1, id2, ...]',
     'profileIndex = 0',
     '',
     'while index < candidates.length:',
     '  candidate = candidates[index]',
     '  ',
     '  if inCooldown(candidate):',
     '    index++',
     '    continue',
     '  ',
     '  try:',
     '    apiKey = resolve(candidate)',
     '    authStorage.setKey(apiKey)',
     '    break',
     '  catch:',
     '    advanceAuthProfile()',
     '',
     'On Success:',
     '  markAuthProfileGood(profile)',
     '',
     'On Error:',
     '  markAuthProfileFailure(profile)',
     '  Start cooldown period'],
    COLOR_LIGHT_BLUE, COLOR_BLUE)

# Data Flow Summary
create_box(15, 0.5, 4.5, 6.5,
    'Data Flow Summary',
    ['User Request',
     '  ↓',
     'runEmbeddedPiAgent(params)',
     '  ↓',
     '[Model Resolution]',
     '  ↓',
     '[Auth Profile Selection]',
     '  ↓',
     '┌──────────────────┐',
     '│ Main Loop        │',
     '│  → Attempt       │',
     '│  → Check Success │',
     '│  → Handle Errors │',
     '│  → Retry/Fallback│',
     '└──────────────────┘',
     '  ↓',
     'Build Payloads',
     '  ↓',
     'EmbeddedPiRunResult',
     '  → payloads[]',
     '  → meta (usage, duration)',
     '  → messagingToolSends',
     '  → stopReason'],
    COLOR_LIGHT_GREEN, COLOR_GREEN)

# Save high-quality PDF
plt.tight_layout()
plt.savefig('Clawdbot-LLM-Run-Engine-HQ.pdf',
            format='pdf',
            dpi=300,
            bbox_inches='tight',
            pad_inches=0.5)

print('✅ High-quality PDF generated: Clawdbot-LLM-Run-Engine-HQ.pdf')
print('📏 Resolution: 300 DPI')
print('📄 Size: 20x14 inches')
print('🎨 Vector-based rendering for crisp text and shapes')

plt.close()
