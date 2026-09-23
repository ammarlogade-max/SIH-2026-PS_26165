const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfDir = path.join(__dirname, '../dataset/documents/bsee');
const txtDir = path.join(__dirname, '../dataset/extracted/bsee');

if (!fs.existsSync(txtDir)) {
  fs.mkdirSync(txtDir, { recursive: true });
}

async function extractAll() {
  const pdfFiles = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${pdfFiles.length} PDF files in ${pdfDir}`);

  let extractedCount = 0;
  for (const pdfFile of pdfFiles) {
    const txtFile = pdfFile.replace('.pdf', '.txt');
    const txtPath = path.join(txtDir, txtFile);
    if (!fs.existsSync(txtPath)) {
      const pdfPath = path.join(pdfDir, pdfFile);
      try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const text = (data.text || '').trim();
        fs.writeFileSync(txtPath, text, 'utf8');
        extractedCount++;
      } catch (err) {
        console.error(`Failed to extract ${pdfFile}:`, err.message);
      }
    }
  }
  console.log(`Successfully extracted ${extractedCount} missing text files.`);
}

extractAll().catch(err => console.error(err));
