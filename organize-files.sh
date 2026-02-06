#!/bin/bash
# organize-files.sh - Easy file organization with clawdbot
# Usage: ./organize-files.sh [folder] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
FOLDER="${1:-$HOME/Downloads}"
SESSION_ID="file-organizer-$(date +%s)"
MODE="${2:-plan}"

# Help text
show_help() {
    cat << EOF
${GREEN}Clawdbot File Organizer${NC}

Usage: $0 [folder] [mode]

Arguments:
  folder    Path to organize (default: ~/Downloads)
  mode      Operation mode (default: plan)

Modes:
  plan      Show organization plan without making changes
  scan      Detailed scan showing which files go where
  execute   Execute the organization plan
  custom    Send a custom message to the agent

Examples:
  $0                                    # Plan for ~/Downloads
  $0 ~/Documents                        # Plan for ~/Documents
  $0 ~/Downloads scan                   # Detailed scan
  $0 ~/Downloads execute                # Execute organization
  $0 ~/Downloads custom "Group by year" # Custom instruction

Environment Variables:
  CLAWDBOT_THINKING    Thinking level (off|minimal|low|medium|high)
  CLAWDBOT_TIMEOUT     Timeout in seconds (default: 300)

EOF
    exit 0
}

# Check if help requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
fi

# Validate folder exists
if [[ ! -d "$FOLDER" ]]; then
    echo -e "${RED}Error: Folder '$FOLDER' does not exist${NC}"
    exit 1
fi

# Get absolute path
FOLDER=$(cd "$FOLDER" && pwd)

echo -e "${BLUE}Clawdbot File Organizer${NC}"
echo -e "Folder: ${GREEN}$FOLDER${NC}"
echo -e "Mode: ${GREEN}$MODE${NC}"
echo ""

# Build base command
BASE_CMD="pnpm clawdbot agent --local --session-id $SESSION_ID"

# Add thinking level if set
if [[ -n "$CLAWDBOT_THINKING" ]]; then
    BASE_CMD="$BASE_CMD --thinking $CLAWDBOT_THINKING"
fi

# Add timeout if set
if [[ -n "$CLAWDBOT_TIMEOUT" ]]; then
    BASE_CMD="$BASE_CMD --timeout $CLAWDBOT_TIMEOUT"
fi

# Build message based on mode
case "$MODE" in
    plan)
        MESSAGE="Organize the files in $FOLDER by creating subdirectories based on file types (presentations, documents, spreadsheets, PDFs, images, videos, audio, archives, installers, code, etc.). Show me a clear plan with the folder structure and classification rules. Do NOT make any changes yet."
        ;;

    scan)
        MESSAGE="Scan $FOLDER and show me exactly which files will go into which folders. List at least 10-20 example files with their destinations. Do NOT make any changes yet."
        ;;

    execute)
        echo -e "${YELLOW}⚠️  This will MOVE files in $FOLDER${NC}"
        echo -e "${YELLOW}⚠️  Make sure you've reviewed the plan first!${NC}"
        echo ""
        read -p "Are you sure you want to proceed? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            echo -e "${RED}Cancelled${NC}"
            exit 0
        fi
        MESSAGE="Execute the file organization plan for $FOLDER NOW without asking for confirmation. I have already confirmed I want to proceed. Create the folder structure and move files to their appropriate locations immediately. Report on what was moved and any errors encountered. Safety rules: do not overwrite existing files, skip files with name collisions, and report them. DO NOT ask me to choose A or B - just proceed with the standard file type organization."
        ;;

    custom)
        if [[ -z "$3" ]]; then
            echo -e "${RED}Error: Custom mode requires a message${NC}"
            echo "Usage: $0 $FOLDER custom \"your message here\""
            exit 1
        fi
        MESSAGE="$3 Context: working with folder $FOLDER"
        ;;

    *)
        echo -e "${RED}Error: Unknown mode '$MODE'${NC}"
        echo "Valid modes: plan, scan, execute, custom"
        exit 1
        ;;
esac

# Execute command
echo -e "${BLUE}Starting clawdbot agent...${NC}"
echo ""

# Run the command
$BASE_CMD --message "$MESSAGE"

# Success
echo ""
echo -e "${GREEN}✓ Agent completed${NC}"

if [[ "$MODE" == "plan" ]]; then
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Review the plan above"
    echo "  2. Get detailed scan: $0 $FOLDER scan"
    echo "  3. Execute organization: $0 $FOLDER execute"
fi

if [[ "$MODE" == "scan" ]]; then
    echo ""
    echo -e "${YELLOW}Next step:${NC}"
    echo "  Execute organization: $0 $FOLDER execute"
fi

if [[ "$MODE" == "execute" ]]; then
    echo ""
    echo -e "${GREEN}✓ Files organized!${NC}"
    echo "  View results: ls -la $FOLDER"
fi
