// ─── Fixture Generator for Multi-Format Safety Reports ────────────────────

import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import sharp from "sharp";

async function generateAllFixtures(targetDir: string) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Standard Text PDF: safety_incident_001.pdf
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page1 = pdfDoc.addPage([600, 450]);

  page1.drawText("OIL INDIA LIMITED — DRILLING SAFETY REPORT", { x: 50, y: 400, size: 16, font: boldFont });
  page1.drawText("Incident Report ID: OIL-DRL-2026-088", { x: 50, y: 375, size: 11, font });
  page1.drawText("Site: Naharkatiya Well Pad 14 | Activity: Mud Circulation", { x: 50, y: 350, size: 11, font });
  page1.drawText("Date: 2026-08-14 | Event Type: Near-Miss", { x: 50, y: 330, size: 11, font });
  page1.drawText("Narrative Description:", { x: 50, y: 295, size: 12, font: boldFont });
  page1.drawText(
    "High pressure mud hose vibrated violently and rotary whip check line parted under 3200 psi.",
    { x: 50, y: 270, size: 11, font }
  );
  page1.drawText(
    "Assistant driller noticed the loose safety clamp and immediately initiated remote emergency shutdown.",
    { x: 50, y: 250, size: 11, font }
  );
  page1.drawText(
    "Personnel evacuated rig floor before catastrophic burst occurred. No injuries sustained.",
    { x: 50, y: 230, size: 11, font }
  );

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(targetDir, "safety_incident_001.pdf"), Buffer.from(pdfBytes));

  // 2. Word DOCX: safety_report_002.docx
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>OIL INDIA LIMITED — SAFETY OBSERVATION</w:t></w:r></w:p>
        <w:p><w:r><w:t>Site: Moran GGS Complex</w:t></w:r></w:p>
        <w:p><w:r><w:t>Activity: Confined Space Vessel Inspection</w:t></w:r></w:p>
        <w:p><w:r><w:t>Date: 2026-08-16</w:t></w:r></w:p>
        <w:p><w:r><w:t>Observation: Confined space entry permit was signed without continuous atmospheric gas monitoring inside separator vessel V-102. Workers entered while toxic hydrocarbon fumes were still venting from purge valve.</w:t></w:r></w:p>
      </w:body>
    </w:document>`
  );
  const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(path.join(targetDir, "safety_report_002.docx"), docxBuffer);

  // 3. Excel Spreadsheet: safety_observations_003.xlsx
  const wb = XLSX.utils.book_new();
  const wsData = [
    {
      observation_description: "Overhead crane wire rope showed broken strands during 10-ton tubing lift over active production manifold.",
      field_location: "Duliajan Central Workshop",
      work_activity: "Heavy Mechanical Lifting",
      event_date: "2026-08-18",
      classification: "Unsafe Condition",
    },
    {
      observation_description: "Contractor technician bypassed high-voltage transformer interlock without lockout-tagout (LOTO) while busbars were energized.",
      field_location: "Digboi Power Station",
      work_activity: "Electrical Switchgear Maintenance",
      event_date: "2026-08-19",
      classification: "Unsafe Act",
    },
    {
      observation_description: "Small water leak noticed from domestic cooling line in mess hall; wiped dry with mop.",
      field_location: "Moran Field Camp",
      work_activity: "Camp Housekeeping",
      event_date: "2026-08-20",
      classification: "Unsafe Condition",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Safety Observations");
  const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  fs.writeFileSync(path.join(targetDir, "safety_observations_003.xlsx"), xlsxBuffer);

  // 4. CSV File: safety_nearmiss_004.csv
  const csvContent =
    `observation_description,site,activity,reported_date,event_type\n` +
    `"Scaffolding cross-brace missing at 12m height on flare stack tower during live flaring.",Jorhat GGS,Work at Height,2026-08-21,near_miss\n` +
    `"H2S gas detector alarm sounded at 25 ppm near wellhead 17 during wireline sampling.",Naharkatiya West,Well Intervention,2026-08-22,near_miss\n`;
  fs.writeFileSync(path.join(targetDir, "safety_nearmiss_004.csv"), csvContent, "utf-8");

  // 5. Plain Text / RTF: safety_card_005.txt
  const txtContent =
    `OIL INDIA LIMITED — STOP SAFETY CARD\n` +
    `Site: Shalmari Rig 2\n` +
    `Activity: Casing Running Operations\n` +
    `Date: 2026-08-23\n` +
    `Event Type: Near-Miss\n` +
    `Details: Derrickman observed that high pressure cementing line safety iron sling had not been anchored. Line whipped violently upon pressurization to 4000 PSI before pump was choked.\n`;
  fs.writeFileSync(path.join(targetDir, "safety_card_005.txt"), txtContent, "utf-8");

  // 6. Scanned Report Image: scanned_observation_006.png
  const svgImage = Buffer.from(`
    <svg width="700" height="280" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff" stroke="#333333" stroke-width="4"/>
      <text x="30" y="50" font-family="sans-serif" font-weight="bold" font-size="22" fill="#111827">OIL INDIA SAFETY OBSERVATION CARD</text>
      <line x1="30" y1="65" x2="670" y2="65" stroke="#9ca3af" stroke-width="2"/>
      <text x="30" y="100" font-family="sans-serif" font-size="16" fill="#374151">Site: Kumchai Field | Activity: Tank Cleaning</text>
      <text x="30" y="130" font-family="sans-serif" font-size="16" fill="#374151">Date: 2026-08-24 | Type: Near-Miss</text>
      <text x="30" y="180" font-family="sans-serif" font-size="18" fill="#111827">Oxygen level dropped to 14 percent inside condensate storage</text>
      <text x="30" y="215" font-family="sans-serif" font-size="18" fill="#111827">tank while personnel were preparing to rig up sandblasting hoses.</text>
      <text x="30" y="250" font-family="sans-serif" font-size="18" fill="#111827">Emergency lifeline retrieval prevented asphyxiation.</text>
    </svg>
  `);
  const pngBuffer = await sharp(svgImage).png().toBuffer();
  fs.writeFileSync(path.join(targetDir, "scanned_observation_006.png"), pngBuffer);

  // 7. Scanned PDF (Embedded image with no text layer): scanned_incident_007.pdf
  const scannedDoc = await PDFDocument.create();
  const embeddedPng = await scannedDoc.embedPng(pngBuffer);
  const scanPage = scannedDoc.addPage([700, 280]);
  scanPage.drawImage(embeddedPng, { x: 0, y: 0, width: 700, height: 280 });
  const scannedPdfBytes = await scannedDoc.save();
  fs.writeFileSync(path.join(targetDir, "scanned_incident_007.pdf"), Buffer.from(scannedPdfBytes));

  console.log(`Generated all multi-format fixtures in: ${targetDir}`);
}

// Generate in both tests/fixtures and demo_fixtures
(async () => {
  await generateAllFixtures(path.join(process.cwd(), "tests", "fixtures"));
  await generateAllFixtures(path.join(process.cwd(), "demo_fixtures"));
})();
