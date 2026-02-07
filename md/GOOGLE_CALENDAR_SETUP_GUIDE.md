# Google Calendar Setup and Usage Guide

Complete guide to configure and use Google Calendar with Clawdbot using the `gog` CLI tool.

---

## 🎯 Overview

The Google Calendar integration allows Clawdbot to:
- Create, read, update, and delete calendar events
- Manage recurring events and reminders
- Invite attendees and create Google Meet links
- Query your schedule and check availability
- Send calendar invitations

**Tool Used:** `gog` (Google CLI tool)

---

## 🚀 Quick Start

### Prerequisites

1. **Install `gog` CLI tool** (if not already installed)
2. **Google Account** with Calendar access
3. **OAuth credentials** configured

### Basic Setup

```bash
# 1. Authenticate with Google Calendar
gog calendar auth

# 2. List your calendars
gog calendar list

# 3. Create a test event
gog calendar create primary \
  --summary "Test Event" \
  --from "2026-02-07T10:00:00-05:00" \
  --to "2026-02-07T11:00:00-05:00"

# 4. List today's events
gog calendar events primary --today
```

---

## 🔐 Authentication Setup

### Step 1: Initial Authentication

```bash
# Authenticate with Google Calendar
gog calendar auth

# This will:
# 1. Open your browser
# 2. Ask you to sign in to Google
# 3. Request Calendar permissions
# 4. Store OAuth tokens locally
```

### Step 2: Verify Authentication

```bash
# Check if authentication is working
gog calendar list

# Should show your calendars:
# primary - Your Name (your.email@gmail.com)
# holidays@holiday.calendar.google.com - Holidays in United States
```

### Step 3: Multiple Accounts

```bash
# Authenticate with a specific account
gog calendar auth --account work@company.com

# Use specific account for commands
gog calendar list --account work@company.com

# List all authenticated accounts
gog accounts list
```

---

## 📅 Calendar Management

### List Calendars

```bash
# List all calendars
gog calendar list

# Output as JSON
gog calendar list --json

# Plain text output (for scripting)
gog calendar list --plain
```

### Get Calendar Details

```bash
# Get details of primary calendar
gog calendar get primary

# Get details of specific calendar
gog calendar get "Work Calendar"
```

---

## 🎫 Event Management

### Creating Events

#### Basic Event

```bash
# Simple event with title and time
gog calendar create primary \
  --summary "Team Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00"
```

**Important:** Use RFC3339 format with timezone offset:
- Format: `YYYY-MM-DDTHH:MM:SS±HH:MM`
- Example: `2026-02-07T14:00:00-05:00` (Eastern Time)
- Example: `2026-02-07T14:00:00Z` (UTC)

#### Event with Details

```bash
gog calendar create primary \
  --summary "Client Presentation" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T16:00:00-05:00" \
  --location "Conference Room A" \
  --description "Q4 results presentation for ABC Corp" \
  --attendees "client@example.com,team@company.com"
```

#### All-Day Event

```bash
# Use date format (no time) with --all-day flag
gog calendar create primary \
  --summary "Company Holiday" \
  --from "2026-12-25" \
  --to "2026-12-25" \
  --all-day
```

#### Event with Reminders

```bash
gog calendar create primary \
  --summary "Important Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --reminder "popup:30m" \
  --reminder "email:1d"
```

**Reminder formats:**
- `popup:30m` - Popup 30 minutes before
- `email:1d` - Email 1 day before
- `popup:1h` - Popup 1 hour before
- `email:2h` - Email 2 hours before

#### Event with Google Meet

```bash
gog calendar create primary \
  --summary "Video Conference" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --with-meet \
  --attendees "team@company.com"
```

#### Recurring Event

```bash
# Weekly meeting every Monday at 10 AM
gog calendar create primary \
  --summary "Weekly Standup" \
  --from "2026-02-10T10:00:00-05:00" \
  --to "2026-02-10T10:30:00-05:00" \
  --rrule "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=12"

# Daily event for 5 days
gog calendar create primary \
  --summary "Morning Briefing" \
  --from "2026-02-07T09:00:00-05:00" \
  --to "2026-02-07T09:15:00-05:00" \
  --rrule "RRULE:FREQ=DAILY;COUNT=5"

# Monthly on 1st day
gog calendar create primary \
  --summary "Monthly Review" \
  --from "2026-03-01T14:00:00-05:00" \
  --to "2026-03-01T15:00:00-05:00" \
  --rrule "RRULE:FREQ=MONTHLY;BYMONTHDAY=1"
```

### Listing Events

```bash
# List today's events
gog calendar events primary --today

# List this week's events
gog calendar events primary --this-week

# List events for specific date range
gog calendar events primary \
  --from "2026-02-07T00:00:00-05:00" \
  --to "2026-02-14T23:59:59-05:00"

# List next 10 events
gog calendar events primary --max-results 10

# Output as JSON
gog calendar events primary --today --json
```

### Viewing Event Details

```bash
# Get specific event by ID
gog calendar event primary EVENT_ID

# Output as JSON
gog calendar event primary EVENT_ID --json
```

### Updating Events

```bash
# Update event summary
gog calendar update primary EVENT_ID \
  --summary "Updated Meeting Title"

# Update event time
gog calendar update primary EVENT_ID \
  --from "2026-02-07T15:00:00-05:00" \
  --to "2026-02-07T16:00:00-05:00"

# Add attendees to existing event
gog calendar update primary EVENT_ID \
  --attendees "new-person@example.com,another@example.com"
```

### Deleting Events

```bash
# Delete an event
gog calendar delete primary EVENT_ID

# Delete without confirmation
gog calendar delete primary EVENT_ID --force

# Delete and send cancellation to attendees
gog calendar delete primary EVENT_ID --send-updates all
```

---

## 🌍 Timezone Handling

### Understanding RFC3339 Format

Google Calendar uses RFC3339 format which includes timezone information in the timestamp itself.

#### Common Timezone Offsets

| Timezone | Winter Offset | Summer Offset | Example (Winter) |
|----------|--------------|---------------|------------------|
| Eastern (ET) | `-05:00` | `-04:00` | `2026-02-07T14:00:00-05:00` |
| Central (CT) | `-06:00` | `-05:00` | `2026-02-07T14:00:00-06:00` |
| Mountain (MT) | `-07:00` | `-06:00` | `2026-02-07T14:00:00-07:00` |
| Pacific (PT) | `-08:00` | `-07:00` | `2026-02-07T14:00:00-08:00` |
| UTC | `Z` | `Z` | `2026-02-07T19:00:00Z` |

#### Examples

```bash
# Eastern Time (EST/EDT)
--from "2026-02-07T14:00:00-05:00"  # Feb 7 (winter, EST)
--from "2026-07-07T14:00:00-04:00"  # Jul 7 (summer, EDT)

# UTC (always Z)
--from "2026-02-07T19:00:00Z"

# Pacific Time
--from "2026-02-07T11:00:00-08:00"
```

---

## 🔧 Advanced Features

### Event Colors

```bash
# Set event color (1-11)
gog calendar create primary \
  --summary "High Priority Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --event-color "11"

# View available colors
gog calendar colors
```

### Event Visibility

```bash
# Set event visibility
gog calendar create primary \
  --summary "Private Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --visibility private

# Options: default, public, private, confidential
```

### Show as Busy/Free

```bash
# Mark as free (won't block calendar)
gog calendar create primary \
  --summary "Optional Training" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --transparency free

# Mark as busy (default)
gog calendar create primary \
  --summary "Important Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --transparency opaque
```

### Guest Permissions

```bash
# Allow guests to invite others and modify event
gog calendar create primary \
  --summary "Collaborative Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --attendees "team@company.com" \
  --guests-can-invite \
  --guests-can-modify \
  --guests-can-see-others
```

---

## 🤖 Integration with Clawdbot

### Using Calendar in Agent Skills

The agent can use calendar commands through the `exec` tool. Here's how to configure it:

#### Example: Schedule Meeting

When the agent sees: "Schedule a meeting with John tomorrow at 2 PM for 1 hour"

The agent executes:
```bash
gog calendar create primary \
  --summary "Meeting with John" \
  --from "2026-02-08T14:00:00-05:00" \
  --to "2026-02-08T15:00:00-05:00" \
  --attendees "john@example.com"
```

#### Example: Check Today's Schedule

When the agent sees: "What's on my calendar today?"

The agent executes:
```bash
gog calendar events primary --today
```

#### Example: Find Free Time

When the agent sees: "When am I free tomorrow?"

The agent executes:
```bash
gog calendar events primary \
  --from "2026-02-08T00:00:00-05:00" \
  --to "2026-02-08T23:59:59-05:00"
```

Then analyzes the output to find free slots.

---

## 💡 Common Use Cases

### 1. Daily Standup Reminder

```bash
# Create recurring daily standup
gog calendar create primary \
  --summary "Daily Standup" \
  --from "2026-02-10T09:00:00-05:00" \
  --to "2026-02-10T09:15:00-05:00" \
  --rrule "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;COUNT=60" \
  --reminder "popup:5m" \
  --with-meet
```

### 2. All-Hands Meeting

```bash
# Monthly all-hands on first Friday
gog calendar create primary \
  --summary "All-Hands Meeting" \
  --from "2026-03-06T15:00:00-05:00" \
  --to "2026-03-06T16:00:00-05:00" \
  --rrule "RRULE:FREQ=MONTHLY;BYDAY=1FR" \
  --with-meet \
  --reminder "email:1d" \
  --reminder "popup:15m"
```

### 3. Block Focus Time

```bash
# Block 2-hour focus time every morning
gog calendar create primary \
  --summary "Focus Time" \
  --from "2026-02-10T09:00:00-05:00" \
  --to "2026-02-10T11:00:00-05:00" \
  --rrule "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;COUNT=20" \
  --transparency free \
  --visibility private \
  --description "Deep work - do not schedule meetings"
```

### 4. Lunch Break

```bash
# Daily lunch break
gog calendar create primary \
  --summary "Lunch" \
  --from "2026-02-10T12:00:00-05:00" \
  --to "2026-02-10T13:00:00-05:00" \
  --rrule "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR" \
  --transparency free
```

### 5. Out of Office

```bash
# Mark out of office for vacation
gog calendar create primary \
  --summary "Out of Office - Vacation" \
  --from "2026-07-04" \
  --to "2026-07-11" \
  --all-day \
  --description "On vacation, back on 7/11"
```

---

## 📊 Calendar Queries

### Find Next Available Slot

```bash
# List events for next week
gog calendar events primary \
  --from "2026-02-10T00:00:00-05:00" \
  --to "2026-02-14T23:59:59-05:00" \
  --json

# Analyze gaps between events to find free slots
```

### Check if Time is Available

```bash
# Check specific time slot
gog calendar events primary \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00"

# If no events returned, slot is free
```

### Count Events This Month

```bash
# Get all events this month
gog calendar events primary \
  --from "2026-02-01T00:00:00-05:00" \
  --to "2026-02-29T23:59:59-05:00" \
  --plain | wc -l
```

---

## 🐛 Troubleshooting

### Issue: "unknown flag --timezone"

**Problem:** The `--timezone` flag doesn't exist in `gog calendar create`

**Solution:** Include timezone in the timestamp itself using RFC3339 format:

```bash
# ❌ Wrong
gog calendar create primary \
  --from "2026-02-07T14:00:00" \
  --timezone "America/New_York"

# ✅ Correct
gog calendar create primary \
  --from "2026-02-07T14:00:00-05:00"
```

---

### Issue: Authentication Failed

**Problem:** `Error: failed to get token` or `Error: credentials not found`

**Solution:**

```bash
# Re-authenticate
gog calendar auth

# Clear cached credentials
rm -rf ~/.gog/credentials

# Authenticate again
gog calendar auth
```

---

### Issue: Calendar Not Found

**Problem:** `Error: calendar 'Work' not found`

**Solution:**

```bash
# List all calendars to find correct ID
gog calendar list

# Use calendar ID instead of name
gog calendar events "calendar-id@group.calendar.google.com"

# Or use "primary" for main calendar
gog calendar events primary
```

---

### Issue: Event Time is Wrong

**Problem:** Event appears at wrong time in Google Calendar

**Cause:** Incorrect timezone offset or forgot to include timezone

**Solution:**

```bash
# Ensure timezone offset is correct for your location
# Eastern Standard Time (winter)
--from "2026-02-07T14:00:00-05:00"

# Eastern Daylight Time (summer)
--from "2026-07-07T14:00:00-04:00"

# Or use UTC
--from "2026-02-07T19:00:00Z"
```

---

### Issue: Recurring Event Not Working

**Problem:** `Error: invalid RRULE format`

**Solution:**

```bash
# Ensure RRULE format is correct
# Must start with "RRULE:"
--rrule "RRULE:FREQ=DAILY;COUNT=5"

# Common patterns:
--rrule "RRULE:FREQ=DAILY;COUNT=10"              # Daily for 10 days
--rrule "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"      # Every Mon, Wed, Fri
--rrule "RRULE:FREQ=MONTHLY;BYMONTHDAY=1"       # 1st of month
--rrule "RRULE:FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25"  # Dec 25 yearly
```

---

## 📖 Command Reference

### Calendar Commands

```bash
# List calendars
gog calendar list

# Get calendar details
gog calendar get CALENDAR_ID

# Create calendar
gog calendar create-calendar --summary "My Calendar"

# View available colors
gog calendar colors
```

### Event Commands

```bash
# Create event
gog calendar create CALENDAR_ID [flags]

# List events
gog calendar events CALENDAR_ID [flags]

# Get event details
gog calendar event CALENDAR_ID EVENT_ID

# Update event
gog calendar update CALENDAR_ID EVENT_ID [flags]

# Delete event
gog calendar delete CALENDAR_ID EVENT_ID

# Quick add (natural language)
gog calendar quick-add CALENDAR_ID "Dinner tomorrow at 7pm"
```

### Common Flags

```bash
--summary STRING           # Event title
--from STRING             # Start time (RFC3339)
--to STRING               # End time (RFC3339)
--description STRING      # Event description
--location STRING         # Location
--attendees STRING        # Comma-separated emails
--all-day                 # All-day event
--rrule STRING            # Recurrence rule
--reminder STRING         # Reminder (can repeat)
--event-color STRING      # Color ID (1-11)
--visibility STRING       # default|public|private|confidential
--transparency STRING     # opaque (busy) | transparent (free)
--with-meet              # Add Google Meet link
--guests-can-invite      # Allow guests to invite
--guests-can-modify      # Allow guests to modify
--send-updates STRING    # all|externalOnly|none
```

---

## 🎯 Quick Reference

### Create Basic Event

```bash
gog calendar create primary \
  --summary "Meeting Title" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00"
```

### Create Event with Everything

```bash
gog calendar create primary \
  --summary "Quarterly Planning" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T16:00:00-05:00" \
  --location "Conference Room A" \
  --description "Q1 2026 planning session" \
  --attendees "team@company.com,boss@company.com" \
  --reminder "email:1d" \
  --reminder "popup:15m" \
  --with-meet \
  --guests-can-modify \
  --event-color "9"
```

### List Today's Events

```bash
gog calendar events primary --today
```

### List This Week

```bash
gog calendar events primary --this-week
```

### Delete Event

```bash
gog calendar delete primary EVENT_ID --send-updates all
```

---

## 💻 Scripting Examples

### Bash Script: Add Daily Events

```bash
#!/bin/bash
# Add standup meetings for next week

for day in {10..14}; do
  gog calendar create primary \
    --summary "Daily Standup" \
    --from "2026-02-${day}T09:00:00-05:00" \
    --to "2026-02-${day}T09:15:00-05:00" \
    --with-meet
  echo "Created standup for 2026-02-$day"
done
```

### Bash Script: Check Free Slots

```bash
#!/bin/bash
# Find free time slots today

EVENTS=$(gog calendar events primary --today --plain)

if [ -z "$EVENTS" ]; then
  echo "✅ Calendar is free all day!"
else
  echo "📅 Today's events:"
  echo "$EVENTS"
fi
```

### Bash Script: Weekly Summary

```bash
#!/bin/bash
# Generate weekly calendar summary

echo "📅 This Week's Schedule"
echo "======================="
gog calendar events primary --this-week --plain | \
  awk '{print "• " $0}'
```

---

## 📚 Related Documentation

- [Heartbeat Setup Guide](HEARTBEAT_SETUP_GUIDE.md) - Automated task scheduling
- [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)
- [RFC3339 Specification](https://www.rfc-editor.org/rfc/rfc3339)

---

## 🎉 Summary

**Quick Setup:**
```bash
# 1. Authenticate
gog calendar auth

# 2. Create your first event
gog calendar create primary \
  --summary "Test Event" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00"

# 3. View today's events
gog calendar events primary --today
```

**Key Reminders:**
- ✅ Always include timezone in timestamps (`-05:00` for ET)
- ✅ Use `primary` for your main calendar
- ✅ Use RFC3339 format: `YYYY-MM-DDTHH:MM:SS±HH:MM`
- ✅ Add reminders with `--reminder "popup:30m"`
- ✅ Create Google Meet links with `--with-meet`

You're ready to manage your calendar with Clawdbot! 📅
