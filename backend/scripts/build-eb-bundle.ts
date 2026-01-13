import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const BUNDLE_NAME = "deploy.zip";
const DIST_DIR = "dist";

async function createZipArchive(filesToZip: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(path.join(PROJECT_ROOT, BUNDLE_NAME));
        const archive = archiver("zip", {
            zlib: { level: 9 } // Maximum compression
        });

        output.on("error", (err) => {
            reject(new Error(`Failed to write archive file: ${err.message}`));
        });

        output.on("close", () => {
            const fileSizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
            console.log(`   Archive created: ${archive.pointer()} bytes (${fileSizeMB} MB)`);
            resolve();
        });

        archive.on("error", (err) => {
            reject(err);
        });

        archive.pipe(output);

        // Add files and directories with exclusions
        for (const item of filesToZip) {
            const fullPath = path.join(PROJECT_ROOT, item);
            if (!fs.existsSync(fullPath)) {
                console.warn(`   ⚠️  Skipping missing item: ${item}`);
                continue;
            }

            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                console.log(`   Adding directory: ${item}/ (excluding node_modules, dist)`);
                archive.glob('**/*', {
                    cwd: fullPath,
                    ignore: ['**/node_modules/**', '**/dist/**', 'node_modules', 'dist']
                }, { prefix: item });
            } else {
                console.log(`   Adding file: ${item}`);
                archive.file(fullPath, { name: item });
            }
        }

        archive.finalize();
    });
}

async function main() {
    console.log("🚀 Starting Elastic Beanstalk Bundle Build...");

    // 1. Clean previous
    const bundlePath = path.join(PROJECT_ROOT, BUNDLE_NAME);
    if (fs.existsSync(bundlePath)) {
        console.log(`🗑️  Removing old ${BUNDLE_NAME}...`);
        fs.unlinkSync(bundlePath);
    }

    // 2. Verify critical files exist
    const packageJsonPath = path.join(PROJECT_ROOT, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        console.error("❌ 'package.json' not found.");
        process.exit(1);
    }

    // 3. Zip files using Node.js archiver (cross-platform)
    console.log("📦 Zipping files...");

    try {
        const filesToZip = [
            "apps",
            "packages",
            "scripts",
            "package.json",
            "package-lock.json",
            "tsconfig.json",
            "prisma",
            ".ebextensions",
            ".npmrc",
            "Procfile",
            "Buildfile"
        ];

        await createZipArchive(filesToZip);

        // Get final file size
        const stats = fs.statSync(bundlePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ Bundle created: ${BUNDLE_NAME}`);
        console.log(`📊 File size: ${fileSizeMB} MB`);
        console.log("👉 Upload this file to AWS Elastic Beanstalk.");

    } catch (error: any) {
        console.error("❌ Failed to create ZIP bundle.");
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack}`);
        }
        process.exit(1);
    }
}

main();
