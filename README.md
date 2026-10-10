# Rufus — Desktop & Web Interface

This is the official repository for **rufus-desktop** (formerly rufus-web), part of the Rufus companion robot dog family. Built with **Tauri v2**, **React 19**, and **TypeScript**, serving as the desktop assistant interface to interact with Rufus, trigger agent actions, monitor system status, and manage physical stunts.

## Architecture

- **Desktop Shell**: Tauri v2 (Rust + WebView2 on Windows)
- **Frontend UI**: React 19 + TypeScript + Vite
- **Backend Link**: Direct HTTP/WebSocket connection to Rufus FastAPI Backend (`http://127.0.0.1:8000`)

## Development

```bash
# Install frontend dependencies
npm install

# Run the desktop app in development mode
npm run tauri dev

# Build production executable
npm run tauri build
```

## Contributing
We welcome collaboration! Before submitting a pull request, please reach out to the maintainers first to discuss the issue and proposed solution.
