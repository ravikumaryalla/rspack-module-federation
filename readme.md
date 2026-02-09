🚀 create-rspack-mfe

CLI to scaffold production-ready Rspack + Module Federation Micro-Frontends

Create a fully configured micro-frontend with:

⚡ Rspack (fast bundler)

🧩 Module Federation setup

🎨 CSS Modules support

🌍 Isolated .env system

🏗 Production build config

🔁 CI pipeline (Azure DevOps ready)

📦 Installation (no global install needed)
npx create-rspack-mfe

🛠 What This CLI Generates
my-mfe/
├── src/
│ ├── App.tsx
│ ├── main.tsx
│ └── .env # App-scoped environment file
│
├── module-federation.config.ts
├── rspack.config.ts # Preconfigured Rspack setup
├── envLoader.ts # Safe env loader (no process.env pollution)
├── azure-pipelines.yml # CI build pipeline
└── package.json

⚙️ Features
🧩 Module Federation Ready

Remote configured

React shared as singleton

remoteEntry.js exposed

🌍 Safe Environment System

Loads from src/.env

No global process.env leakage

Injected via DefinePlugin

🎨 CSS Modules Built-In
.button {
color: red;
}

Imported safely:

import styles from './Button.module.css'

🏗 Production Build Script
pnpm build:prod

Uses:

rspack build --mode production

🔁 CI/CD Ready

Includes an Azure pipeline that:

Installs Node

Installs dependencies

Builds the micro-frontend

Copies dist/

Publishes build artifact

🚀 Development

After project creation:

cd my-mfe
pnpm dev

🔐 Environment Variables

Located in:

src/.env

Example:

API_BASE_URL=http://localhost:3000
APP_NAME=MyMFE
FEATURE_FLAG=true

🧠 Why This Tool Exists

Most scaffolds give you an app.

This CLI gives you a micro-frontend platform starter:

Capability Included
Bundler ✅
Federation ✅
Env isolation ✅
CSS modules ✅
Production build ✅
CI pipeline ✅
📌 Use Cases

Enterprise micro-frontend architectures

Multi-team frontend platforms

Rspack migrations

Module Federation adoption
