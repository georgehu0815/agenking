#!/usr/bin/env python3
"""
Generate high-quality Soul-Evil Hook Architecture diagram
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Polygon
import matplotlib.lines as mlines

# Set up high-quality figure
plt.figure(figsize=(24, 18), dpi=300)
ax = plt.gca()
ax.set_xlim(0, 24)
ax.set_ylim(0, 18)
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
COLOR_GRAY = '#6b7280'
COLOR_LIGHT_GRAY = '#f3f4f6'

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
        x + width/2, y + height - 0.2,
        label,
        ha='center', va='top',
        fontsize=11, fontweight='bold',
        color=edge_color
    )

    # Add details
    y_offset = y + height - 0.5
    for line in details:
        ax.text(
            x + 0.15, y_offset,
            line,
            ha='left', va='top',
            fontsize=8,
            color='#374151'
        )
        y_offset -= 0.22

def create_diamond(x, y, width, height, label, details, color, edge_color, linewidth=2):
    """Create a diamond decision box"""
    # Diamond coordinates
    points = [
        [x + width/2, y + height],  # top
        [x + width, y + height/2],  # right
        [x + width/2, y],           # bottom
        [x, y + height/2]           # left
    ]
    diamond = Polygon(points, closed=True,
                     linewidth=linewidth,
                     edgecolor=edge_color,
                     facecolor=color,
                     zorder=1)
    ax.add_patch(diamond)

    # Add text
    y_offset = y + height/2
    ax.text(
        x + width/2, y_offset,
        label,
        ha='center', va='center',
        fontsize=10, fontweight='bold',
        color=edge_color
    )
    if details:
        ax.text(
            x + width/2, y_offset - 0.3,
            details,
            ha='center', va='center',
            fontsize=8,
            color='#374151'
        )

def create_arrow(x1, y1, x2, y2, color='#3b82f6', style='solid', linewidth=2):
    """Create an arrow between two points"""
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle='->,head_width=0.25,head_length=0.25',
        color=color,
        linewidth=linewidth,
        linestyle=style,
        zorder=2
    )
    ax.add_patch(arrow)

# Title
ax.text(12, 17.5, 'Soul-Evil Hook Architecture Flow',
        ha='center', va='center', fontsize=24, fontweight='bold', color=COLOR_BLUE)

# Startup Phase
create_box(1, 15.5, 3, 1.2,
    'Gateway Startup',
    ['loadInternalHooks()'],
    COLOR_LIGHT_BLUE, COLOR_BLUE)

create_arrow(2.5, 15.5, 2.5, 14.7)

create_box(1, 13, 3, 1.5,
    'Hook Discovery',
    ['Scan: dist/hooks/bundled/soul-evil/',
     'Read: HOOK.md frontmatter',
     'Events: ["agent:bootstrap"]',
     'Load: handler.ts',
     'Register handler function'],
    COLOR_LIGHT_BLUE, COLOR_BLUE)

create_arrow(2.5, 13, 2.5, 12.2)

create_box(1, 10.8, 3, 1,
    'Gateway Ready',
    ['4 hooks loaded'],
    COLOR_LIGHT_GREEN, COLOR_GREEN)

create_arrow(4, 11.3, 5.5, 11.3)

# Runtime Phase
create_box(5.5, 10.8, 3, 1,
    'User Message',
    ['Agent session starts'],
    COLOR_LIGHT_YELLOW, COLOR_YELLOW)

create_arrow(7, 10.8, 7, 10)

create_box(5.5, 8.5, 3, 1.3,
    'Agent Bootstrap',
    ['Load workspace files',
     'Trigger: agent:bootstrap'],
    COLOR_LIGHT_PURPLE, COLOR_PURPLE)

create_arrow(7, 8.5, 7, 7.5)

# Decision Diamond 1
create_diamond(6, 6, 2, 1.5,
    'Hook\nEnabled?',
    '',
    COLOR_LIGHT_RED, COLOR_RED)

# No path
create_arrow(6, 6.75, 4.5, 6.75, COLOR_RED)
ax.text(5.2, 6.9, 'No', fontsize=9, color=COLOR_RED)

create_box(2.5, 6.3, 2, 0.9,
    'Use SOUL.md',
    ['(original)'],
    COLOR_LIGHT_GRAY, COLOR_GRAY)

# Yes path
create_arrow(8, 6.75, 9.5, 6.75, COLOR_GREEN)
ax.text(8.8, 6.9, 'Yes', fontsize=9, color=COLOR_GREEN)

# Decision Diamond 2
create_diamond(9.5, 6, 2.5, 1.5,
    'In Purge\nWindow?',
    '21:00-21:15',
    COLOR_LIGHT_RED, COLOR_RED)

# Purge Yes path
create_arrow(10.75, 6, 10.75, 5)
ax.text(10.9, 5.5, 'Yes', fontsize=9, color=COLOR_GREEN)

create_box(9.5, 3.7, 2.5, 1.1,
    'Use SOUL_EVIL',
    ['reason: purge'],
    COLOR_LIGHT_PURPLE, COLOR_PURPLE, linewidth=3)

# Purge No path
create_arrow(12, 6.75, 13.5, 6.75, COLOR_BLUE)
ax.text(12.8, 6.9, 'No', fontsize=9, color=COLOR_BLUE)

# Decision Diamond 3
create_diamond(13.5, 6, 2.5, 1.5,
    'Random\nChance?',
    'Math.random<0.05',
    COLOR_LIGHT_RED, COLOR_RED)

# Random Yes path
create_arrow(14.75, 6, 14.75, 5)
ax.text(14.9, 5.5, 'Yes (5%)', fontsize=9, color=COLOR_GREEN)

create_box(13.5, 3.7, 2.5, 1.1,
    'Use SOUL_EVIL',
    ['reason: chance'],
    COLOR_LIGHT_PURPLE, COLOR_PURPLE, linewidth=3)

# Random No path
create_arrow(14.75, 7.5, 14.75, 8.5, COLOR_GRAY)
ax.text(14.9, 8, 'No (95%)', fontsize=9, color=COLOR_GRAY)

create_box(13.5, 8.5, 2.5, 0.9,
    'Use SOUL.md',
    ['(original)'],
    COLOR_LIGHT_GRAY, COLOR_GRAY)

# Merge arrows
create_arrow(12, 4.25, 13.5, 4.25, COLOR_PURPLE)

# Continue flow
create_arrow(14.75, 3.7, 14.75, 2.8)

create_box(13.5, 1.2, 2.5, 1.4,
    'Load File',
    ['Read workspace/',
     'SOUL_EVIL.md',
     'Check exists',
     'Check not empty'],
    COLOR_LIGHT_PURPLE, COLOR_PURPLE)

create_arrow(14.75, 1.2, 14.75, 0.3)

# Bottom section - continued flow on right side
create_box(17.5, 8.5, 5, 1.6,
    'Bootstrap File Swap',
    ['Find SOUL.md in bootstrapFiles[]',
     'Replace content with SOUL_EVIL',
     'Return updated array',
     'In-memory only (no disk writes)'],
    COLOR_LIGHT_PURPLE, COLOR_PURPLE, linewidth=3)

# Arrow from Load File to Swap
create_arrow(16, 2, 19.5, 8.5, COLOR_PURPLE, style='dashed')

create_arrow(20, 8.5, 20, 7.5)

create_box(17.5, 6, 5, 1.3,
    'System Prompt Built',
    ['LLM receives SOUL_EVIL personality',
     'Agent responds with alternate behavior'],
    COLOR_LIGHT_GREEN, COLOR_GREEN, linewidth=3)

# Configuration box (bottom left)
create_box(1, 0.3, 5.5, 3.5,
    'Configuration',
    ['Location: ~/.clawdbot/clawdbot.json',
     '',
     'Settings:',
     '  • enabled: true',
     '  • file: SOUL_EVIL.md',
     '  • chance: 0.05 (5%)',
     '  • purge:',
     '      - at: 21:00',
     '      - duration: 15m',
     '',
     'Files:',
     '  • SOUL.md (original personality)',
     '  • SOUL_EVIL.md (alternate personality)',
     '',
     'Key Points:',
     '  • Purge window takes precedence',
     '  • Timezone-aware calculations',
     '  • In-memory swap only',
     '  • No disk file modifications'],
    COLOR_LIGHT_GRAY, COLOR_GRAY)

# Statistics box (bottom right)
create_box(17.5, 0.3, 5, 2.2,
    'Trigger Statistics',
    ['Purge Window:',
     '  21:00-21:15 daily (15 min/day = 1.04%)',
     '',
     'Random Chance:',
     '  5% of remaining time (~4.95% of day)',
     '',
     'Total Evil Probability:',
     '  ~6% per day',
     '',
     'Expected Sessions:',
     '  ~1-2 evil sessions per day (typical usage)'],
    COLOR_LIGHT_YELLOW, COLOR_YELLOW)

# Key files reference
create_box(7, 0.3, 10, 3.5,
    'Key Files',
    ['Handler & Logic:',
     '  • src/hooks/bundled/soul-evil/handler.ts',
     '  • src/hooks/soul-evil.ts (decideSoulEvil, applySoulEvilOverride)',
     '',
     'Hook System:',
     '  • src/hooks/loader.ts (discovery & registration)',
     '  • src/hooks/internal-hooks.ts (event system)',
     '',
     'Configuration:',
     '  • src/config/zod-schema.hooks.ts (validation)',
     '  • src/config/types.hooks.ts (TypeScript types)',
     '',
     'Metadata:',
     '  • dist/hooks/bundled/soul-evil/HOOK.md',
     '',
     'Core Functions:',
     '  • decideSoulEvil() - Evaluate trigger conditions',
     '  • applySoulEvilOverride() - Swap file content',
     '  • registerInternalHook() - Register handler',
     '  • triggerInternalHook() - Fire event'],
    COLOR_LIGHT_BLUE, COLOR_BLUE)

# Legend
legend_elements = [
    mlines.Line2D([], [], color=COLOR_BLUE, linewidth=3, label='Startup Phase'),
    mlines.Line2D([], [], color=COLOR_YELLOW, linewidth=3, label='Runtime Trigger'),
    mlines.Line2D([], [], color=COLOR_RED, linewidth=3, label='Decision Point'),
    mlines.Line2D([], [], color=COLOR_PURPLE, linewidth=3, label='SOUL_EVIL Path'),
    mlines.Line2D([], [], color=COLOR_GRAY, linewidth=3, label='SOUL.md Path'),
    mlines.Line2D([], [], color=COLOR_GREEN, linewidth=3, label='Final Result'),
]
ax.legend(handles=legend_elements, loc='upper right', fontsize=9, framealpha=0.9)

# Save high-quality PDF
plt.tight_layout()
plt.savefig('soul-evil-architecture-HQ.pdf',
            format='pdf',
            dpi=300,
            bbox_inches='tight',
            pad_inches=0.5)

print('✅ High-quality PDF generated: soul-evil-architecture-HQ.pdf')
print('📏 Resolution: 300 DPI')
print('📄 Size: 24x18 inches')
print('🎨 Vector-based rendering for crisp text and shapes')

plt.close()
