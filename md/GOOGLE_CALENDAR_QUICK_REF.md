# Google Calendar Quick Reference

Quick commands for Google Calendar management with Clawdbot.

---

## ⚡ Quick Setup

# turn gog api
go to:

https://console.cloud.google.com/apis/dashboard?cloudshell=true&chat=true&project=edbot-78ee6

```sh

gcloud services enable gmail.googleapis.com calendar-json.googleapis.com drive.googleapis.com people.googleapis.com sheets.googleapis.com docs.googleapis.com
```


```bash
# Authenticate
gog calendar auth

# List calendars
gog calendar list

# Test
gog calendar events primary --today
```

---

## 📅 Create Events

### Basic Event

```bash
gog calendar create primary \
  --summary "Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00"
```

### Event with Details

```bash
gog calendar create primary \
  --summary "Client Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --location "Room 101" \
  --description "Q4 Review" \
  --attendees "client@example.com"
```

### All-Day Event

```bash
gog calendar create primary \
  --summary "Holiday" \
  --from "2026-12-25" \
  --to "2026-12-25" \
  --all-day
```

### Event with Google Meet

```bash
gog calendar create primary \
  --summary "Video Call" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --with-meet
```

### Event with Reminders

```bash
gog calendar create primary \
  --summary "Important Meeting" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T15:00:00-05:00" \
  --reminder "popup:30m" \
  --reminder "email:1d"
```

---

## 🔄 Recurring Events

```bash
# Daily for 5 days
--rrule "RRULE:FREQ=DAILY;COUNT=5"

# Every weekday
--rrule "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"

# Weekly on Mondays
--rrule "RRULE:FREQ=WEEKLY;BYDAY=MO"

# Monthly on 1st
--rrule "RRULE:FREQ=MONTHLY;BYMONTHDAY=1"

# Yearly on Dec 25
--rrule "RRULE:FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25"
```

### Example: Weekly Standup

```bash
gog calendar create primary \
  --summary "Weekly Standup" \
  --from "2026-02-10T09:00:00-05:00" \
  --to "2026-02-10T09:30:00-05:00" \
  --rrule "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=12" \
  --with-meet
```

---

## 📋 List Events

```bash
# Today
gog calendar events primary --today

# This week
gog calendar events primary --this-week

# Date range
gog calendar events primary \
  --from "2026-02-07T00:00:00-05:00" \
  --to "2026-02-14T23:59:59-05:00"

# Next 10 events
gog calendar events primary --max-results 10

# JSON output
gog calendar events primary --today --json
```

---

## 🔍 View Event

```bash
# Get event details
gog calendar event primary EVENT_ID

# JSON output
gog calendar event primary EVENT_ID --json
```

---

## ✏️ Update Event

```bash
# Update title
gog calendar update primary EVENT_ID \
  --summary "New Title"

# Update time
gog calendar update primary EVENT_ID \
  --from "2026-02-07T15:00:00-05:00" \
  --to "2026-02-07T16:00:00-05:00"

# Add location
gog calendar update primary EVENT_ID \
  --location "Conference Room B"

# Add attendees
gog calendar update primary EVENT_ID \
  --attendees "new-person@example.com"
```

---

## 🗑️ Delete Event

```bash
# Delete event (REQUIRES --force in automation/non-interactive mode)
gog calendar delete primary EVENT_ID --force

# Delete with cancellation sent to attendees
gog calendar delete primary EVENT_ID --force --send-updates all

# Note: --force is MANDATORY when running from Clawdbot/scripts
# Without --force, the command will fail in non-interactive mode
```

---

## 🌍 Timezone Reference

**RFC3339 Format:** `YYYY-MM-DDTHH:MM:SS±HH:MM`

| Timezone | Winter | Summer | Example |
|----------|--------|--------|---------|
| **Eastern (ET)** | `-05:00` | `-04:00` | `2026-02-07T14:00:00-05:00` |
| **Central (CT)** | `-06:00` | `-05:00` | `2026-02-07T14:00:00-06:00` |
| **Mountain (MT)** | `-07:00` | `-06:00` | `2026-02-07T14:00:00-07:00` |
| **Pacific (PT)** | `-08:00` | `-07:00` | `2026-02-07T14:00:00-08:00` |
| **UTC** | `Z` | `Z` | `2026-02-07T19:00:00Z` |

---

## 🎨 Event Options

### Colors

```bash
--event-color "1"   # Lavender
--event-color "2"   # Sage
--event-color "3"   # Grape
--event-color "4"   # Flamingo
--event-color "5"   # Banana
--event-color "6"   # Tangerine
--event-color "7"   # Peacock
--event-color "8"   # Graphite
--event-color "9"   # Blueberry
--event-color "10"  # Basil
--event-color "11"  # Tomato
```

### Visibility

```bash
--visibility default       # Default calendar visibility
--visibility public        # Public event
--visibility private       # Private event
--visibility confidential  # Confidential (shows as busy)
```

### Transparency (Busy/Free)

```bash
--transparency opaque       # Show as busy (default)
--transparency transparent  # Show as free
```

### Guest Permissions

```bash
--guests-can-invite    # Guests can invite others
--guests-can-modify    # Guests can edit event
--guests-can-see-others # Guests can see attendee list
```

---

## 📊 Common Use Cases

### 1. Daily Standup

```bash
gog calendar create primary \
  --summary "Daily Standup" \
  --from "2026-02-10T09:00:00-05:00" \
  --to "2026-02-10T09:15:00-05:00" \
  --rrule "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;COUNT=60" \
  --with-meet \
  --reminder "popup:5m"
```

### 2. Focus Time

```bash
gog calendar create primary \
  --summary "Focus Time - Do Not Disturb" \
  --from "2026-02-10T09:00:00-05:00" \
  --to "2026-02-10T11:00:00-05:00" \
  --rrule "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR" \
  --transparency transparent \
  --visibility private
```

### 3. Lunch Break

```bash
gog calendar create primary \
  --summary "Lunch" \
  --from "2026-02-10T12:00:00-05:00" \
  --to "2026-02-10T13:00:00-05:00" \
  --rrule "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR" \
  --transparency transparent
```

### 4. Out of Office

```bash
gog calendar create primary \
  --summary "Out of Office - Vacation" \
  --from "2026-07-04" \
  --to "2026-07-11" \
  --all-day \
  --description "On vacation, back July 11"
```

### 5. Client Presentation

```bash
gog calendar create primary \
  --summary "Client Presentation - ABC Corp" \
  --from "2026-02-07T14:00:00-05:00" \
  --to "2026-02-07T16:00:00-05:00" \
  --location "Conference Room A" \
  --attendees "client@abc.com,team@company.com" \
  --with-meet \
  --reminder "email:1d" \
  --reminder "popup:30m" \
  --event-color "11" \
  --guests-can-see-others
```

---

## 🐛 Quick Troubleshooting

### ❌ Error: "unknown flag --timezone"

**Wrong:**
```bash
gog calendar create primary --from "2026-02-07T14:00:00" --timezone "America/New_York"
```

**Correct:**
```bash
gog calendar create primary --from "2026-02-07T14:00:00-05:00"
```

---

### ❌ Event appears at wrong time

**Cause:** Wrong timezone offset

**Fix:**
```bash
# Check if timezone offset is correct for your location
# Eastern: -05:00 (winter), -04:00 (summer)
# Or use UTC: Z
--from "2026-02-07T14:00:00-05:00"  # Eastern
--from "2026-02-07T19:00:00Z"       # UTC
```

---

### ❌ Authentication failed

**Fix:**
```bash
# Re-authenticate
gog calendar auth

# Or clear and re-auth
rm -rf ~/.gog/credentials
gog calendar auth
```

---

### ❌ Calendar not found

**Fix:**
```bash
# List calendars to find correct ID
gog calendar list

# Use "primary" for main calendar
gog calendar events primary
```

---

## 📖 Command Cheatsheet

| Task | Command |
|------|---------|
| **Auth** | `gog calendar auth` |
| **List calendars** | `gog calendar list` |
| **Create event** | `gog calendar create primary [flags]` |
| **Today's events** | `gog calendar events primary --today` |
| **This week** | `gog calendar events primary --this-week` |
| **Get event** | `gog calendar event primary EVENT_ID` |
| **Update event** | `gog calendar update primary EVENT_ID [flags]` |
| **Delete event** | `gog calendar delete primary EVENT_ID` |
| **Colors** | `gog calendar colors` |
| **Help** | `gog calendar create --help` |

---

## 💡 Pro Tips

1. **Always include timezone** in timestamps to avoid confusion
2. **Use "primary"** for your main calendar instead of email
3. **Add reminders** with `--reminder "popup:30m"`
4. **Create Meet links** with `--with-meet`
5. **Mark focus time** as `--transparency transparent` (shows as free)
6. **Use RRULE** for recurring events instead of creating multiple times
7. **JSON output** with `--json` for scripting and parsing
8. **Test with `--today`** to quickly verify calendar access

---

## 🔗 Full Documentation

[Google Calendar Setup Guide](GOOGLE_CALENDAR_SETUP_GUIDE.md) - Complete setup and usage instructions

---

**Ready to schedule!** 📅
