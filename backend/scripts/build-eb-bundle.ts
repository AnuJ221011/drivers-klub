import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BUNDLE_NAME = "deploy.zip";
const DIST_DIR = "dist";

async function main() {
    console.log("🚀 Starting Elastic Beanstalk Bundle Build...");

    // 1. Clean previous
    if (fs.existsSync(BUNDLE_NAME)) {
        console.log(`🗑️  Removing old ${BUNDLE_NAME}...`);
        fs.unlinkSync(BUNDLE_NAME);
    }

    // 2. Verify Dist exists
    if (!fs.existsSync(DIST_DIR)) {
        console.error("❌ 'dist' directory not found. Run 'npm run build' first.");
        process.exit(1);
    }

    // 3. Zip files
    // Using command line 'zip' (Available in Unix/Git Bash/Bitbucket Pipelines)
    // We include: dist/, package.json, package-lock.json, Procfile, .env.example (optional), prisma/ (for schema)
    console.log("📦 Zipping files...");

    try {
        // -r: recursive
        // -q: quiet
        const filesToZip = [
            "dist",
            "package.json",
            "package-lock.json",
            "Procfile",
            "prisma"
        ].join(" ");

        execSync(`zip -r -q ${BUNDLE_NAME} ${filesToZip}`, { stdio: "inherit" });

        console.log(`✅ Bundle created: ${BUNDLE_NAME}`);
        console.log("👉 Upload this file to AWS Elastic Beanstalk.");

    } catch (error: any) {
        console.error("❌ Zip failed. Ensure 'zip' command is available (Git Bash or Linux).");
        console.error(error.message);
        process.exit(1);
    }
}

main();
