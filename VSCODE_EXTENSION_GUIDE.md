# 🔌 FortiState VS Code Extension

Complete guide for creating and publishing the FortiState VS Code Extension.

---

## 📋 Extension Features

The FortiState VS Code Extension will provide:

1. **📸 Store Snapshot Viewer**
   - Sidebar panel showing all store snapshots
   - Click to open store file
   - Real-time snapshot updates
   - Export snapshots directly

2. **🔍 Store Navigator**
   - Quick jump to store definitions
   - Search for stores across workspace
   - List all FortiState stores in project

3. **🎨 Syntax Highlighting**
   - Special highlighting for `createStore()` calls
   - Store key auto-completion
   - Inline store value previews

4. **🚀 Quick Actions**
   - Right-click menu: "Open in Inspector"
   - CodeLens above store definitions
   - Status bar with active stores count

5. **🔗 Inspector Integration**
   - Connect to running inspector
   - Sync state in real-time
   - Navigate from inspector to code

---

## 🏗️ Extension Structure

```
vscode-extension/
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
├── .vscodeignore            # Files to exclude
├── README.md                 # Extension README
├── CHANGELOG.md              # Extension changelog
├── LICENSE                   # License file
├── icon.png                  # Extension icon (128x128)
├── src/
│   ├── extension.ts          # Main entry point
│   ├── snapshotProvider.ts   # TreeView provider for snapshots
│   ├── storeDecorator.ts     # Syntax decorations
│   ├── inspectorClient.ts    # Connect to inspector
│   └── commands/
│       ├── openInspector.ts
│       ├── navigateToStore.ts
│       └── exportSnapshot.ts
└── media/
    ├── light/                # Light theme icons
    └── dark/                 # Dark theme icons
```

---

## 🚀 Quick Start

### Prerequisites
```bash
npm install -g yo generator-code @vscode/vsce
```

### Create Extension
```bash
cd fortistate-root
mkdir vscode-extension
cd vscode-extension

# Use Yeoman to scaffold
yo code

# Choose:
# - New Extension (TypeScript)
# - Name: fortistate
# - Identifier: fortistate
# - Description: FortiState inspector integration and store navigation
# - Initialize git: No (already in repo)
# - Package manager: npm
```

---

## � Privacy & Distribution Strategy

The VS Code extension lives in `packages/visual-studio` and is intentionally **not** published as open source. Keep these guardrails in place when preparing marketplace builds:

- Leave `"private": true` in `packages/visual-studio/package.json` so the workspace can never be released to npm by accident.
- Store credentials (Clerk, FortiState API, etc.) in `.env.local` and `.env` files that stay untracked; the `.env.example` file documents required keys.
- Use a `.vscodeignore` file to exclude source maps, tests, storyboards, and private docs from the packaged `.vsix` (see template below).
- Build and publish from a private environment. Only the generated `.vsix` is shared externally—attach it to GitHub releases or upload it to the Marketplace.
- When tagging public releases, do **not** add `packages/visual-studio` artifacts to the Git tag or npm package; instead, reference the `.vsix` download URL.

```text
# packages/visual-studio/.vscodeignore
.env*
test/**
scripts/**
docs/**
*.map
*.test.ts
*.spec.ts
README-private.md
```

Publish flow summary:

1. Run `npm install` in `packages/visual-studio`.
2. Build the extension: `npm run build`.
3. Package privately: `npx vsce package --no-dependencies` (produces `fortistate-<version>.vsix`).
4. Upload the `.vsix` manually in the VS Code Marketplace portal **or** run `npx vsce publish --packagePath fortistate-<version>.vsix` using a secure PAT.
5. Host the `.vsix` for GitHub users (e.g., release asset) while keeping the source private in this monorepo.

---

## �📦 package.json (Extension Manifest)

```json
{
  "name": "fortistate",
  "displayName": "FortiState",
  "description": "Inspector integration, store navigation, and real-time state debugging for FortiState",
  "version": "3.0.0",
  "publisher": "axfrgo",
  "icon": "icon.png",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": [
    "Debuggers",
  npm install -g yo generator-code @vscode/vsce
  ```

  Before packaging, make sure `package.json` includes an `engines.vscode` entry (for example, `"^1.80.0"`) and that `.vscodeignore` excludes `.env*`, local logs, and other private assets.
    "Visualization"
  ],
  npx @vscode/vsce package --no-dependencies
    "fortistate",
    "state",
    "inspector",
    "debugging",
    "react",
    "vue"
  ],
  "activationEvents": [
    "onLanguage:typescript",
    "onLanguage:javascript",
    "onLanguage:typescriptreact",
    "onLanguage:javascriptreact",
    "workspaceContains:**/fortistate"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "fortistate.openInspector",
      npx @vscode/vsce login axfrgo
      npx @vscode/vsce publish
      },
      {
        "command": "fortistate.navigateToStore",
        "title": "Navigate to Store Definition",
        "category": "FortiState"
      },
      {
        "command": "fortistate.refreshSnapshots",
        "title": "Refresh Snapshots",
        "category": "FortiState",
        "icon": "$(refresh)"
      },
      {
        "command": "fortistate.exportSnapshot",
        "title": "Export Snapshot",
        "category": "FortiState",
        "icon": "$(export)"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "fortistate",
          "title": "FortiState",
          "icon": "media/icon.svg"
        }
      ]
    },
    "views": {
      "fortistate": [
        {
          "id": "fortistate.snapshots",
          "name": "Store Snapshots"
        },
        {
          "id": "fortistate.stores",
          "name": "Active Stores"
        }
      ]
    },
    "menus": {
      "view/title": [
        {
          "command": "fortistate.refreshSnapshots",
          "when": "view == fortistate.snapshots",
          "group": "navigation"
        }
      ],
      "view/item/context": [
        {
          "command": "fortistate.exportSnapshot",
          "when": "view == fortistate.snapshots",
          "group": "inline"
        }
      ],
      "editor/context": [
        {
          "command": "fortistate.navigateToStore",
          "when": "editorTextFocus && resourceExtname =~ /\\.(ts|js)x?$/",
          "group": "fortistate"
        }
      ]
    },
    "configuration": {
      "title": "FortiState",
      "properties": {
        "fortistate.inspectorUrl": {
          "type": "string",
          "default": "http://localhost:4000",
          "description": "URL of the FortiState Inspector"
        },
        "fortistate.autoConnect": {
          "type": "boolean",
          "default": true,
          "description": "Automatically connect to inspector on startup"
        },
        "fortistate.showDecorations": {
          "type": "boolean",
          "default": true,
          "description": "Show inline decorations for stores"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.80.0",
    "@vscode/vsce": "^2.19.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "ws": "^8.13.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/axfrgo/fortistate.git",
    "directory": "vscode-extension"
  },
  "bugs": {
    "url": "https://github.com/axfrgo/fortistate/issues"
  },
  "homepage": "https://github.com/axfrgo/fortistate#readme",
  "license": "ISC"
}
```

---

## 🎨 Extension Icon

Create `icon.png` (128x128 pixels) with FortiState branding.

---

## 📝 src/extension.ts (Main Entry Point)

```typescript
import * as vscode from 'vscode';
import { SnapshotProvider } from './snapshotProvider';
import { StoreProvider } from './storeProvider';
import { InspectorClient } from './inspectorClient';

export function activate(context: vscode.ExtensionContext) {
  console.log('FortiState extension activated');

  // Get configuration
  const config = vscode.workspace.getConfiguration('fortistate');
  const inspectorUrl = config.get<string>('inspectorUrl', 'http://localhost:4000');

  // Create providers
  const snapshotProvider = new SnapshotProvider();
  const storeProvider = new StoreProvider();
  const inspectorClient = new InspectorClient(inspectorUrl);

  // Register tree views
  vscode.window.registerTreeDataProvider('fortistate.snapshots', snapshotProvider);
  vscode.window.registerTreeDataProvider('fortistate.stores', storeProvider);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('fortistate.openInspector', () => {
      vscode.env.openExternal(vscode.Uri.parse(inspectorUrl));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('fortistate.navigateToStore', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const text = editor.document.getText(selection);
      
      // Find store definition
      await vscode.commands.executeCommand('workbench.action.findInFiles', {
        query: `createStore('${text}'`,
        isRegex: false
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('fortistate.refreshSnapshots', () => {
      snapshotProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('fortistate.exportSnapshot', async (item) => {
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`snapshot-${item.label}.json`),
        filters: { 'JSON': ['json'] }
      });
      
      if (uri) {
        const fs = require('fs');
        fs.writeFileSync(uri.fsPath, JSON.stringify(item.data, null, 2));
        vscode.window.showInformationMessage('Snapshot exported!');
      }
    })
  );

  // Auto-connect if enabled
  if (config.get<boolean>('autoConnect', true)) {
    inspectorClient.connect();
  }

  // Status bar
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  statusBar.text = '$(database) FortiState';
  statusBar.tooltip = 'FortiState Inspector';
  statusBar.command = 'fortistate.openInspector';
  statusBar.show();
  context.subscriptions.push(statusBar);
}

export function deactivate() {
  console.log('FortiState extension deactivated');
}
```

---

## 🌳 src/snapshotProvider.ts (TreeView Provider)

```typescript
import * as vscode from 'vscode';

export class SnapshotProvider implements vscode.TreeDataProvider<SnapshotItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SnapshotItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private snapshots: Map<string, any> = new Map();

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SnapshotItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SnapshotItem): Promise<SnapshotItem[]> {
    if (!element) {
      // Root level - show all stores
      const items: SnapshotItem[] = [];
      for (const [key, value] of this.snapshots) {
        items.push(new SnapshotItem(key, value, vscode.TreeItemCollapsibleState.Collapsed));
      }
      return items;
    } else {
      // Show store properties
      const items: SnapshotItem[] = [];
      if (typeof element.data === 'object') {
        for (const [key, value] of Object.entries(element.data)) {
          items.push(new SnapshotItem(
            `${key}: ${JSON.stringify(value)}`,
            value,
            vscode.TreeItemCollapsibleState.None
          ));
        }
      }
      return items;
    }
  }

  addSnapshot(storeKey: string, value: any) {
    this.snapshots.set(storeKey, value);
    this.refresh();
  }
}

class SnapshotItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly data: any,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = JSON.stringify(data, null, 2);
    this.iconPath = new vscode.ThemeIcon('database');
  }
}
```

---

## 🔗 src/inspectorClient.ts (WebSocket Connection)

```typescript
import * as vscode from 'vscode';
import WebSocket from 'ws';

export class InspectorClient {
  private ws?: WebSocket;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(private url: string) {}

  connect() {
    try {
      const wsUrl = this.url.replace('http:', 'ws:').replace('https:', 'wss:');
      this.ws = new WebSocket(wsUrl + '/ws');

      this.ws.on('open', () => {
        vscode.window.showInformationMessage('Connected to FortiState Inspector');
      });

      this.ws.on('message', (data: string) => {
        const message = JSON.parse(data);
        // Handle store updates, snapshots, etc.
        console.log('Inspector message:', message);
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.ws.on('close', () => {
        vscode.window.showWarningMessage('Disconnected from FortiState Inspector');
        this.scheduleReconnect();
      });
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }
}
```

---

## 📄 .vscodeignore

```
.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
!dist/**/*.js
```

---

## 🚀 Build and Publish

### 1. Build Extension
```bash
cd vscode-extension
npm install
npm run compile
```

### 2. Test Locally
```bash
# Press F5 in VS Code to open Extension Development Host
# Or install manually:
vsce package
code --install-extension fortistate-3.0.0.vsix
```

### 3. Publish to Marketplace

#### Create Publisher (one-time)
1. Go to https://marketplace.visualstudio.com/manage
2. Create account with Azure DevOps
3. Create publisher ID: `axfrgo`

#### Get Personal Access Token
1. Go to https://dev.azure.com/[your-org]/_usersSettings/tokens
2. Create new token with "Marketplace (publish)" scope
3. Save token securely

#### Login and Publish
```bash
vsce login axfrgo
# Enter your Personal Access Token

vsce publish
```

---

## 📋 Publishing Checklist

- [ ] Extension builds successfully
- [ ] All commands work
- [ ] TreeView displays correctly
- [ ] WebSocket connection works
- [ ] Icon is professional (128x128)
- [ ] README has screenshots
- [ ] CHANGELOG is updated
- [ ] License is included
- [ ] Version matches main package (3.0.0)
- [ ] Tested in VS Code
- [ ] No console errors

---

## 🔗 Resources

- **VS Code Extension API:** https://code.visualstudio.com/api
- **Publishing Guide:** https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Extension Samples:** https://github.com/microsoft/vscode-extension-samples
- **vsce CLI:** https://github.com/microsoft/vscode-vsce

---

**Ready to build the extension? Let's go! 🚀**
