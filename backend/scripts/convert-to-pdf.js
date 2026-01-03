import { mdToPdf } from 'md-to-pdf';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertAllToPdf() {
    console.log('📄 Converting all documentation to PDF...\n');

    const docsDir = join(__dirname, '..', 'docs');
    const pdfDir = join(docsDir, 'pdf');

    try {
        // Get all .md files in docs directory
        const files = await readdir(docsDir);
        const mdFiles = files.filter(file => file.endsWith('.md'));

        let successCount = 0;
        let failCount = 0;

        for (const file of mdFiles) {
            const inputPath = join(docsDir, file);
            const outputPath = join(pdfDir, basename(file, '.md') + '.pdf');

            try {
                console.log(`Converting: ${file}...`);
                await mdToPdf({ path: inputPath }, { dest: outputPath });
                console.log(`✅ Generated: ${basename(outputPath)}\n`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed: ${file} - ${error.message}\n`);
                failCount++;
            }
        }

        console.log('\n==========================================');
        console.log('📊 PDF Generation Summary');
        console.log('==========================================');
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`📁 Output: ${pdfDir}`);
        console.log('\n🎉 PDF generation complete!');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

convertAllToPdf();
