---
description: Start the Brain OS observer dashboard to visualize cognitive loop execution in real-time
allowed-tools: ["Bash"]
---

# Brain Observer Dashboard

Start the Brain OS observer dashboard for real-time visualization of cognitive loop execution.

## Steps

1. Set the `BRAIN_DATA_DIR` environment variable to the Brain OS data directory:
   - Use `$BRAIN_DATA_DIR` if already set (injected by session-start hook)
   - Otherwise default to `${XDG_CONFIG_HOME:-$HOME/.config}/brain-os`

2. Locate the observer server entry point at `${CLAUDE_PLUGIN_ROOT}/observer/` (or the repo's `observer/` directory).

3. Check if port 4100 is available. If not, increment the port number until an available port is found (try up to 4110).

4. Start the observer server:
   ```bash
   BRAIN_DATA_DIR="$BRAIN_DATA_DIR" npx tsx observer/server/index.ts --port <PORT>
   ```
   If `tsx` is not available, fall back to:
   ```bash
   BRAIN_DATA_DIR="$BRAIN_DATA_DIR" node observer/server/index.js --port <PORT>
   ```

5. Open the dashboard in the default browser:
   ```bash
   open "http://localhost:<PORT>"    # macOS
   xdg-open "http://localhost:<PORT>"  # Linux
   ```

6. Report the URL to the user so they can access the dashboard.
