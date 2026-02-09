const { spawn } = require("child_process");

function runPnpmCreateRspack(projectName, cwd) {
    return new Promise((resolve, reject) => {
        console.log("\nRunning `pnpm create rspack@latest`...");
        console.log(
            "You may be prompted for template options in the terminal. Choose a React + TS preset if available.",
        );

        const child = spawn("pnpm", ["create", "rspack@latest", projectName], {
            cwd: cwd,
            stdio: "inherit",
            shell: process.platform === "win32",
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(`pnpm create rspack@latest failed with exit code ${code}`),
                );
            }
        });
    });
}

function installDependencies(targetDir) {
    return new Promise((resolve, reject) => {
        console.log(
            "\nInstalling dependencies with pnpm (this might take a while)...",
        );

        const child = spawn("pnpm", ["install"], {
            cwd: targetDir,
            stdio: "inherit",
            shell: process.platform === "win32",
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`pnpm install failed with exit code ${code}`));
            }
        });
    });
}

module.exports = { runPnpmCreateRspack, installDependencies };
