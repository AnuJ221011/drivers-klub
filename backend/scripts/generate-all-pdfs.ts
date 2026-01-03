import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { mdToPdf } from 'md-to-pdf';

async function generatePDFs() {
    console.log('📄 Generating PDFs for all documentation...\n');

    const docsDir = join(process.cwd(), 'docs');
    const pdfDir = join(docsDir, 'pdf');

    // Get all markdown files in docs directory
    const mdFiles = readdirSync(docsDir)
        .filter(file => file.endsWith('.md'))
        .map(file => join(docsDir, file));

    let successCount = 0;
    let failCount = 0;

    for (const mdFile of mdFiles) {
        const fileName = basename(mdFile, '.md');
        const pdfPath = join(pdfDir, `${fileName}.pdf`);

        try {
            console.log(`Converting: ${fileName}.md...`);

            const pdf = await mdToPdf(
                { path: mdFile },
                {
                    dest: pdfPath,
                    pdf_options: {
                        format: 'A4',
                        margin: {
                            top: '20mm',
                            right: '20mm',
                            bottom: '20mm',
                            left: '20mm'
                        },
                        printBackground: true
                    },
                    stylesheet: `
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 3px solid #3498db;
              padding-bottom: 10px;
            }
            h2 {
              color: #34495e;
              border-bottom: 2px solid #95a5a6;
              padding-bottom: 8px;
              margin-top: 30px;
            }
            h3 {
              color: #7f8c8d;
              margin-top: 20px;
            }
            code {
              background-color: #f4f4f4;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
            }
            pre {
              background-color: #f8f8f8;
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 15px;
              overflow-x: auto;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #3498db;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            blockquote {
              border-left: 4px solid #3498db;
              padding-left: 20px;
              margin-left: 0;
              color: #555;
            }
          `
                }
            );

            console.log(`✅ Generated: ${fileName}.pdf\n`);
            successCount++;
        } catch (error: any) {
            console.error(`❌ Failed: ${fileName}.md - ${error.message}\n`);
            failCount++;
        }
    }

    console.log('\n==========================================');
    console.log('📊 PDF Generation Summary');
    console.log('==========================================');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📁 Output Directory: ${pdfDir}`);
    console.log('\n🎉 PDF generation complete!');
}

generatePDFs().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
