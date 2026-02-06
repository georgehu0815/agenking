# Clawdbot Gateway Daemon Scripts

These scripts help you manage the Clawdbot Gateway as a background daemon process.

## Quick Start

```bash
# Start the gateway as a daemon
./start-gateway.sh

# Check status
./status-gateway.sh

# Stop the gateway
./stop-gateway.sh
```

---

## Scripts Overview

### 1. `start-gateway.sh` - Start Gateway as Daemon

**Purpose**: Starts the Clawdbot Gateway in the background (daemon mode) so it continues running even after you close the terminal.

**Features**:
- ✅ Runs in background with `nohup`
- ✅ Gracefully stops existing gateway first
- ✅ Saves PID for easy management
- ✅ Logs to `~/.clawdbot/logs/gateway.log`
- ✅ Error logs to `~/.clawdbot/logs/gateway.err.log`
- ✅ Verifies successful startup
- ✅ Color-coded output

**Usage**:
```bash
./start-gateway.sh
```

**Output**:
```
Starting Clawdbot Gateway...
Verifying configuration...
Starting gateway in background...
✓ Gateway started successfully!
  PID: 12345
  Logs: /Users/you/.clawdbot/logs/gateway.log
  Errors: /Users/you/.clawdbot/logs/gateway.err.log

To view logs in real-time:
  tail -f /Users/you/.clawdbot/logs/gateway.log

To stop the gateway:
  pnpm clawdbot gateway stop
  or kill 12345
```

---

### 2. `stop-gateway.sh` - Stop Gateway Daemon

**Purpose**: Gracefully stops the running gateway daemon and all child processes.

**Features**:
- ✅ Finds and stops all gateway-related processes (parent + children)
- ✅ Tries graceful shutdown first (SIGTERM)
- ✅ Waits up to 10 seconds for clean exit
- ✅ Force kills if necessary (SIGKILL)
- ✅ Cleans up PID file
- ✅ Handles missing PID file gracefully
- ✅ Searches for orphaned processes and cleans them up

**Usage**:
```bash
./stop-gateway.sh
```

**Output**:
```
Stopping Clawdbot Gateway...
Sending SIGTERM to PID 12345...
✓ Gateway stopped gracefully
Gateway stopped successfully
```

---

### 3. `status-gateway.sh` - Check Gateway Status

**Purpose**: Shows comprehensive status information about the gateway daemon.

**Features**:
- ✅ Shows PID and running status
- ✅ Displays process information (CPU, memory, uptime)
- ✅ Checks port 18789 status
- ✅ Shows log file sizes and locations
- ✅ Displays recent log entries
- ✅ Lists quick commands

**Usage**:
```bash
./status-gateway.sh
```

**Output**:
```
=== Clawdbot Gateway Status ===

PID File: Found (/Users/you/.clawdbot/logs/gateway.pid)
PID: 12345
Status: ✓ Running

Process Info:
  PID  PPID USER    %CPU %MEM     ETIME COMMAND
12345     1 you      2.5  1.2   1:23:45 node gateway

Port Status:
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    12345  you   21u  IPv4 0x...      0t0  TCP localhost:18789 (LISTEN)

Log Files:
Gateway Log: /Users/you/.clawdbot/logs/gateway.log (2.3M, 5432 lines)
Error Log: /Users/you/.clawdbot/logs/gateway.err.log (128K, 234 lines)

Recent Log Entries (last 5 lines):
2026-01-27T02:30:15.123Z [gateway] Started successfully
2026-01-27T02:30:15.456Z [ws] WebSocket server listening on 18789
...

=== Quick Commands ===
Start:  ./start-gateway.sh
Stop:   ./stop-gateway.sh
Status: ./status-gateway.sh
Logs:   tail -f /Users/you/.clawdbot/logs/gateway.log
Errors: tail -f /Users/you/.clawdbot/logs/gateway.err.log
```

---

## How It Works

### Daemon Mode

The gateway runs as a **daemon** (background process) using:
- `nohup` - Ignores hangup signals when terminal closes
- `&` - Runs process in background
- PID file - Stores process ID at `~/.clawdbot/logs/gateway.pid`
- Log redirection - stdout → `gateway.log`, stderr → `gateway.err.log`

### Process Lifecycle

```
start-gateway.sh:
1. Stop existing gateway (graceful → force)
2. Verify configuration
3. Start gateway with nohup in background
4. Save PID to file
5. Verify startup success

stop-gateway.sh:
1. Read PID from file
2. Send SIGTERM (graceful shutdown)
3. Wait up to 10 seconds
4. Send SIGKILL if still running (force)
5. Clean up PID file

status-gateway.sh:
1. Check PID file exists
2. Verify process is running
3. Display process info, port status, logs
4. Show recent log entries
```

---

## Log Files

All logs are stored in `~/.clawdbot/logs/`:

### `gateway.log` - Standard Output
Contains:
- Startup messages
- Channel connections
- Agent events
- WebSocket connections
- Normal operation logs

**View in real-time:**
```bash
tail -f ~/.clawdbot/logs/gateway.log
```

### `gateway.err.log` - Error Output
Contains:
- Error messages
- Stack traces
- Warnings
- Deprecation notices

**View in real-time:**
```bash
tail -f ~/.clawdbot/logs/gateway.err.log
```

### `gateway.pid` - Process ID
Contains: Single line with the PID of the running gateway process

---

## Common Operations

### Start Gateway at Boot

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# Auto-start Clawdbot Gateway
if ! pgrep -f "clawdbot-gateway" > /dev/null; then
    cd /Users/ghu/aiworker/clawdbot && ./start-gateway.sh
fi
```

### Monitor Logs

```bash
# Follow gateway logs
tail -f ~/.clawdbot/logs/gateway.log

# Follow error logs
tail -f ~/.clawdbot/logs/gateway.err.log

# Follow both logs simultaneously
tail -f ~/.clawdbot/logs/gateway.log ~/.clawdbot/logs/gateway.err.log

# Show last 100 lines
tail -100 ~/.clawdbot/logs/gateway.log
```

### Restart Gateway

```bash
# Method 1: Using scripts
./stop-gateway.sh && ./start-gateway.sh

# Method 2: Single command
./stop-gateway.sh && sleep 2 && ./start-gateway.sh

# Method 3: Via Clawdbot CLI
pnpm clawdbot gateway stop && pnpm clawdbot gateway run --bind loopback --port 18789
```

### Clean Logs

```bash
# Clear logs (keep last 1000 lines)
tail -1000 ~/.clawdbot/logs/gateway.log > /tmp/gateway.log && mv /tmp/gateway.log ~/.clawdbot/logs/gateway.log
tail -1000 ~/.clawdbot/logs/gateway.err.log > /tmp/gateway.err.log && mv /tmp/gateway.err.log ~/.clawdbot/logs/gateway.err.log

# Or completely clear
> ~/.clawdbot/logs/gateway.log
> ~/.clawdbot/logs/gateway.err.log
```

---

## Troubleshooting

### Gateway Won't Start

**Check logs:**
```bash
cat ~/.clawdbot/logs/gateway.err.log
```

**Common issues:**
1. Port 18789 already in use
   ```bash
   lsof -i :18789
   # Kill the process using the port
   ```

2. Old gateway still running
   ```bash
   ./stop-gateway.sh
   pkill -9 -f gateway
   ```

3. Missing dependencies
   ```bash
   pnpm install
   ```

### Gateway Stops Unexpectedly

**Check error logs:**
```bash
tail -50 ~/.clawdbot/logs/gateway.err.log
```

**Common causes:**
- Out of memory
- Configuration errors
- Network issues
- Dependency problems

### Stale PID File

If PID file exists but process isn't running:
```bash
rm ~/.clawdbot/logs/gateway.pid
./start-gateway.sh
```

### Multiple Gateway Instances

Stop all instances:
```bash
pkill -9 -f "clawdbot-gateway"
pkill -9 -f "gateway:watch"
rm ~/.clawdbot/logs/gateway.pid
./start-gateway.sh
```

---

## Integration with Clawdbot CLI

These scripts complement the built-in Clawdbot commands:

| Script Command | Clawdbot CLI Equivalent |
|----------------|-------------------------|
| `./start-gateway.sh` | `pnpm clawdbot gateway run --bind loopback --port 18789` (foreground) |
| `./stop-gateway.sh` | `pnpm clawdbot gateway stop` |
| `./status-gateway.sh` | `pnpm clawdbot channels status --probe` |

**Key differences:**
- Scripts run gateway as **daemon** (background)
- CLI runs gateway in **foreground** (blocks terminal)
- Scripts handle PID management automatically
- Scripts provide better log management

---

## Advanced Configuration

### Custom Log Location

Edit the scripts and change:
```bash
LOG_DIR="${HOME}/.clawdbot/logs"
```

To:
```bash
LOG_DIR="/custom/path/to/logs"
```

### Custom Port

Edit `start-gateway.sh` and change the gateway command:
```bash
nohup pnpm clawdbot gateway run --bind loopback --port 18790 > "$GATEWAY_LOG" 2> "$GATEWAY_ERR" &
```

### Log Rotation

Add to crontab:
```bash
# Rotate logs daily at midnight
0 0 * * * tail -10000 ~/.clawdbot/logs/gateway.log > /tmp/gateway.log && mv /tmp/gateway.log ~/.clawdbot/logs/gateway.log
```

---

## Security Notes

- Gateway runs as your user (no root required)
- Logs may contain sensitive information (API keys, tokens)
- PID file is readable by your user only
- Bind to `loopback` (127.0.0.1) for local-only access
- Use Tailscale for secure remote access

---

## Related Documentation

- **Clawdbot Gateway**: [docs/gateway/](/docs/gateway/)
- **Configuration**: [docs/gateway/configuration.md](/docs/gateway/configuration.md)
- **Security**: [docs/gateway/security.md](/docs/gateway/security.md)
- **Troubleshooting**: [docs/gateway/troubleshooting.md](/docs/gateway/troubleshooting.md)

---

## Quick Reference

```bash
# Start
./start-gateway.sh

# Stop
./stop-gateway.sh

# Status
./status-gateway.sh

# Logs
tail -f ~/.clawdbot/logs/gateway.log

# Restart
./stop-gateway.sh && ./start-gateway.sh

# Check if running
./status-gateway.sh | grep "Status:"

# Get PID
cat ~/.clawdbot/logs/gateway.pid

# Kill by PID
kill $(cat ~/.clawdbot/logs/gateway.pid)
```

---

*Created: 2026-01-27*
*Scripts Location: `/Users/ghu/aiworker/clawdbot/`*


功能
终端指令
启动Clawdbot后台
clawdbot daemon start
停止后台服务
clawdbot daemon stop
查看插件状态
clawdbot browser extension status
重新配置API密钥
clawdbot config set api_key 你的新密钥
测试网页截图
pnpm clawdbot browser screenshot "https://www.baidu.com"