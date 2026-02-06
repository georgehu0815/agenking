#!/bin/bash
# Quick script to show which catalog skill is active

echo "=========================================="
echo "Which Catalog Skill Is Active?"
echo "=========================================="
echo ""

BUNDLED="/Users/ghu/aiworker/clawdbot/skills/catalog_lookup_http"
WORKSPACE="/Users/ghu/clawd/skills/catalog_lookup_http"
WORKSPACE_ALT="/Users/ghu/clawd/skills/catalog"

echo "Skill loading precedence: extra < bundled < managed < workspace"
echo ""

if [ -d "$WORKSPACE" ]; then
    echo "✅ WORKSPACE skill found (HIGHEST PRIORITY):"
    echo "   $WORKSPACE"
    echo ""
    echo "   🎯 This one is ACTIVE"
    echo "   Last modified: $(stat -f "%Sm" "$WORKSPACE/SKILL.md")"
elif [ -d "$WORKSPACE_ALT" ]; then
    echo "⚠️  Workspace has different name:"
    echo "   $WORKSPACE_ALT"
    echo "   (This will NOT override bundled skill)"
    echo ""
    echo "✅ BUNDLED skill is ACTIVE:"
    echo "   $BUNDLED"
    echo "   Last modified: $(stat -f "%Sm" "$BUNDLED/SKILL.md")"
else
    echo "✅ BUNDLED skill is ACTIVE:"
    echo "   $BUNDLED"
    echo "   Last modified: $(stat -f "%Sm" "$BUNDLED/SKILL.md")"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if [ -d "$WORKSPACE" ]; then
    echo "✏️  Make changes to: $WORKSPACE"
else
    echo "✏️  Make changes to: $BUNDLED"
    echo ""
    echo "To use workspace version instead:"
    echo "  cp -r $BUNDLED $WORKSPACE"
    echo "  # Then edit: $WORKSPACE"
fi

echo ""
