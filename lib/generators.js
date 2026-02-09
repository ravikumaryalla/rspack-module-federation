const fs = require("fs");
const path = require("path");

function updatePackageJson(targetDir, projectName, shouldInstallMui) {
  const pkgPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.warn(
      "No package.json found in target project; skipping dependency setup.",
    );
    return;
  }

  const raw = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw);

  pkg.name = projectName;
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.scripts = pkg.scripts || {};

  ///  setting the react version to 19.2.3
  pkg.dependencies["react"] = "19.2.3";
  pkg.dependencies["react-dom"] = "19.2.3";

  if (shouldInstallMui) {
    pkg.dependencies["@mui/material"] = "^7.3.7";
    pkg.dependencies["@jcat/design-system"] = "latest";
    pkg.dependencies["@emotion/styled"] = "^11.14.1";
    pkg.dependencies["@emotion/react"] = "^11.14.0";
  }

  // ---------------------------
  // 🔥 ADD THIS PART (scripts)
  // ---------------------------
  pkg.scripts["build:prod"] =
    pkg.scripts["build:prod"] || "rspack build --mode production";

  // Module Federation for Rspack
  pkg.dependencies["@module-federation/enhanced"] =
    pkg.dependencies["@module-federation/enhanced"] || "^0.22.1";

  // CSS loaders
  pkg.devDependencies["style-loader"] =
    pkg.devDependencies["style-loader"] || "^4.0.0";
  pkg.devDependencies["css-loader"] =
    pkg.devDependencies["css-loader"] || "^7.1.2";

  // Dotenv support
  pkg.devDependencies["dotenv"] = pkg.devDependencies["dotenv"] || "^17.2.3";

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log(
    "Updated package.json with project name, scripts, and required dependencies.",
  );
}

function writeModuleFederationConfig(targetDir, projectName, shouldInstallMui) {
  const mfPath = path.join(targetDir, "module-federation.config.ts");
  if (fs.existsSync(mfPath)) {
    console.log(
      "module-federation.config.ts already exists; skipping creation.",
    );
    return;
  }

  const name = projectName.replace(/[^a-zA-Z0-9_]/g, "_");

  let sharedConfig = `
    react: {
      singleton: true,
    },
    'react-dom': {
      singleton: true,
    },`;

  if (shouldInstallMui) {
    sharedConfig += `
    "@mui/material": { singleton: true },
    "@jcat/design-system": { singleton: true },
    "@emotion/styled": { singleton: true },
    "@emotion/react": { singleton: true },`;
  }

  const content = `import { createModuleFederationConfig } from '@module-federation/enhanced/rspack';

export default createModuleFederationConfig({
  name: '${name}',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App.tsx',
  },
  shared: {${sharedConfig}
  },
});
`;

  fs.writeFileSync(mfPath, content, "utf8");
  console.log("Created module-federation.config.ts.");
}

function writeRspackConfig(targetDir) {
  const configPath = path.join(targetDir, "rspack.config.ts");

  const content = `import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import mfConfig from './module-federation.config';
import { loadEnvFromFile, getAllDefineEnvs } from './envLoader';


const isDev = process.env.NODE_ENV === 'development';

const ENV_FILE = './.env';
loadEnvFromFile(ENV_FILE);

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['last 2 versions', '> 0.2%', 'not dead', 'Firefox ESR'];




export default defineConfig({
  devtool:false,
  entry: {
    main: './src/main.tsx',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '...'],
  },
  module: {
    rules: [
      {
        test: /\\.module\\.css$/,
        use: [
          'style-loader', // Injects CSS into the DOM
         {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isDev
                  ? '[local]_[hash:base64:5]'
                  : '[hash:base64]',
                namedExport: false,
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\\.svg$/,
        type: 'asset',
      },
      {
        test: /\\.(jsx?|tsx?)$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDev,
                    refresh: isDev,
                  },
                },
              },
              env: { targets },
            } satisfies SwcLoaderOptions,
          },
        ],
      },
    ],
  },
   plugins: [
    new rspack.DefinePlugin(getAllDefineEnvs()),
    new ModuleFederationPlugin(mfConfig),
    new rspack.HtmlRspackPlugin({
      template: './index.html',
    }),
    isDev ? new ReactRefreshRspackPlugin() : null,
  ],
  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
  },
  experiments: {
    css: true,
  },
  devServer: {
    port: 8080,
    hot: true,
    historyApiFallback: true,
  },
});
`;

  fs.writeFileSync(configPath, content, "utf8");
  console.log("Rewrote rspack.config.ts with Module Federation + CSS loaders.");
}

function writeEnvLoader(targetDir) {
  const filePath = path.join(targetDir, "envLoader.ts");

  if (fs.existsSync(filePath)) {
    console.log("envLoader.ts already exists; skipping creation.");
    return;
  }

  const content = `import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Stores ONLY variables loaded from file (never touches process.env)
 */
let fileEnvs: Record<string, string> = {};

/**
 * Load env file from a custom path into local memory ONLY
 */
export function loadEnvFromFile(envFilePath: string): void {
  const fullPath: string = path.resolve(envFilePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(\`ENV file not found: \${fullPath}\`);
  }

  const envFileContent: Buffer = fs.readFileSync(fullPath);

  // Parse manually instead of injecting into process.env
  fileEnvs = dotenv.parse(envFileContent) as Record<string, string>;
}

/**
 * Convert ONLY file envs into Webpack DefinePlugin format
 */
export function getAllDefineEnvs(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in fileEnvs) {
    const value: string = fileEnvs[key];
    result[\`process.env.\${key}\`] = JSON.stringify(value);
  }

  return result;
}
`;

  fs.writeFileSync(filePath, content, "utf8");
  console.log("Created envLoader.ts in project root.");
}

function writeEnvFile(targetDir) {
  const envPath = path.join(targetDir, ".env");

  if (fs.existsSync(envPath)) {
    console.log(".env already exists in root; skipping creation.");
    return;
  }

  const content = `# Environment variables for this Micro-Frontend
API_BASE_URL=http://localhost:3000
APP_NAME=MyMFE
FEATURE_FLAG=true
`;

  fs.writeFileSync(envPath, content, "utf8");
  console.log("Created .env file in root directory.");
}

function writeBuildYaml(targetDir) {
  const yamlPath = path.join(targetDir, "azure-pipelines.yml");

  if (fs.existsSync(yamlPath)) {
    console.log("azure-pipelines.yml already exists; skipping creation.");
    return;
  }

  const content = `trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  NODE_VERSION: '20.x'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: $(NODE_VERSION)
    displayName: 'Install Node.js'

  - script: corepack enable
    displayName: 'Enable Corepack (pnpm)'

  - script: pnpm install
    displayName: 'Install dependencies'

  - script: pnpm build:prod
    displayName: 'Build Micro-Frontend (Production)'

  # ✅ COPY BUILD OUTPUT
  - task: CopyFiles@2
    displayName: 'Copy dist to Artifact Staging Directory'
    inputs:
      SourceFolder: 'dist'
      Contents: '**'
      TargetFolder: '$(Build.ArtifactStagingDirectory)'

  # ✅ PUBLISH ARTIFACT
  - task: PublishBuildArtifacts@1
    displayName: 'Publish Build Artifacts'
    inputs:
      pathToPublish: '$(Build.ArtifactStagingDirectory)'
      artifactName: 'mfe-build'
`;

  fs.writeFileSync(yamlPath, content, "utf8");
  console.log("Created azure-pipelines.yml.");
}

function setupBootstrap(targetDir) {
  const srcDir = path.join(targetDir, "src");
  const mainPath = path.join(srcDir, "main.tsx");
  const bootstrapPath = path.join(srcDir, "bootstrap.tsx");

  if (!fs.existsSync(mainPath)) {
    console.warn("src/main.tsx not found; skipping bootstrap setup.");
    return;
  }

  if (fs.existsSync(bootstrapPath)) {
    console.log("bootstrap.tsx already exists; skipping setup.");
    return;
  }

  // Read original main.tsx content
  const mainContent = fs.readFileSync(mainPath, "utf8");

  // Write content to bootstrap.tsx
  fs.writeFileSync(bootstrapPath, mainContent, "utf8");
  console.log("Created src/bootstrap.tsx with content from main.tsx.");

  // Replace main.tsx with async import
  const newMainContent = "import('./bootstrap');\n";
  fs.writeFileSync(mainPath, newMainContent, "utf8");
  console.log("Updated src/main.tsx to import bootstrap asynchronously.");
}

module.exports = {
  updatePackageJson,
  writeModuleFederationConfig,
  writeRspackConfig,
  writeEnvLoader,
  writeEnvFile,
  writeBuildYaml,
  setupBootstrap,
};
