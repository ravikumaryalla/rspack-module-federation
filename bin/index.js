#!/usr/bin/env node

// CLI to scaffold a new Rspack + Module Federation micro-frontend
// using `pnpm create rspack@latest`, then auto-configure:
// - @module-federation/enhanced (Rspack plugin)
// - style-loader & css-loader
// - module-federation.config.ts
// - rspack.config.ts with ModuleFederationPlugin and CSS loaders
//
// Usage (from the `migration` directory):
//   node create-jcat-mfe.cjs

const path = require("path");
const { toKebabCase } = require("../lib/utils");
const { askQuestion } = require("../lib/prompts");
const { runPnpmCreateRspack, installDependencies } = require("../lib/commands");
const {
  updatePackageJson,
  writeModuleFederationConfig,
  writeRspackConfig,
  writeEnvLoader,
  writeEnvFile,
  writeBuildYaml,
  setupBootstrap,
} = require("../lib/generators");

const ROOT_DIR = process.cwd();

async function main() {
  try {
    console.log("Rspack + Module Federation MFE Creator\n");

    const nameInput = await askQuestion("Enter the name of your new project: ");
    if (!nameInput.trim()) {
      console.error("Project name cannot be empty.");
      process.exit(1);
    }

    const muiInput = await askQuestion(
      "Do you want to setup MUI and JCAT design system? (y/n) ",
    );
    const shouldInstallMui = muiInput.trim().toLowerCase().startsWith("y");

    const projectName = toKebabCase(nameInput);
    const targetDir = path.join(ROOT_DIR, projectName);

    console.log(`\nProject name: ${projectName}`);
    console.log(`Target directory: ${targetDir}`);

    await runPnpmCreateRspack(projectName, ROOT_DIR);

    updatePackageJson(targetDir, projectName, shouldInstallMui);
    writeModuleFederationConfig(targetDir, projectName, shouldInstallMui);
    writeEnvLoader(targetDir);
    writeRspackConfig(targetDir);
    writeEnvFile(targetDir);
    writeBuildYaml(targetDir);
    setupBootstrap(targetDir);

    await installDependencies(targetDir);

    console.log("\nDone!");
    console.log("\nNext steps:");
    console.log(`  cd ${projectName}`);
    console.log("  pnpm dev");
  } catch (err) {
    console.error("\nError while creating project:");
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
