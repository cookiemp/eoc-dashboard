const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'test-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate Test PDF 1: Earthquake Incident
function generateEarthquakePDF() {
  const doc = new PDFDocument();
  const outputPath = path.join(outputDir, 'test-earthquake-report.pdf');
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(18).text('EMERGENCY FIELD REPORT', { align: 'center' });
  doc.fontSize(16).text('EARTHQUAKE DAMAGE ASSESSMENT', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12);
  doc.text('Date: January 15, 2025');
  doc.text('Location: Downtown Addis Ababa, Bole District');
  doc.text('Coordinates: 9.0320°N, 38.7469°E');
  doc.text('Reporter: Field Officer Sarah Johnson');
  doc.moveDown();

  doc.fontSize(14).text('INCIDENT SUMMARY:', { underline: true });
  doc.fontSize(12);
  doc.text(
    'A magnitude 5.8 earthquake struck the downtown area at approximately 14:30 local time. ' +
    'Significant structural damage observed to multiple buildings along Bole Road corridor. ' +
    'Emergency services are responding to multiple locations.'
  );
  doc.moveDown();

  doc.fontSize(14).text('CASUALTIES:', { underline: true });
  doc.fontSize(12);
  doc.text('- 3 confirmed fatalities');
  doc.text('- 47 injured (23 serious, 24 minor injuries)');
  doc.text('- Several people still trapped in collapsed structures');
  doc.moveDown();

  doc.fontSize(14).text('DAMAGE ASSESSMENT:', { underline: true });
  doc.fontSize(12);
  doc.text('- Office building at Bole Road: Partial collapse, rescue operations ongoing');
  doc.text('- Parking structure: Severe structural damage, evacuation complete');
  doc.text('- Water main break at major intersection');
  doc.text('- Gas leak reported - utility crews responding');
  doc.moveDown();

  doc.fontSize(14).text('IMMEDIATE NEEDS:', { underline: true });
  doc.fontSize(12);
  doc.text('- Heavy rescue equipment required');
  doc.text('- Medical support (trauma teams)');
  doc.text('- Structural engineers for safety assessment');
  doc.text('- Temporary shelter for displaced residents (estimated 200+ people)');
  doc.moveDown();

  doc.fontSize(12);
  doc.text('CURRENT STATUS: ACTIVE RESPONSE');
  doc.text('Priority: CRITICAL');
  doc.moveDown();
  doc.text('Report Filed: 2025-01-15 15:45:00');

  doc.end();
  console.log(`✓ Generated: ${outputPath}`);
}

// Generate Test PDF 2: Flooding Incident
function generateFloodingPDF() {
  const doc = new PDFDocument();
  const outputPath = path.join(outputDir, 'test-flooding-report.pdf');
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(18).text('EMERGENCY FIELD REPORT', { align: 'center' });
  doc.fontSize(16).text('SEVERE FLOODING EVENT', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12);
  doc.text('Date: February 3, 2025');
  doc.text('Location: Kirkos Sub-City, Residential Area');
  doc.text('Coordinates: 8.9806°N, 38.7578°E');
  doc.text('Reporter: Field Officer Mohammed Ali');
  doc.moveDown();

  doc.fontSize(14).text('INCIDENT SUMMARY:', { underline: true });
  doc.fontSize(12);
  doc.text(
    'Heavy rainfall over the past 48 hours has caused severe flooding in low-lying areas. ' +
    'Multiple neighborhoods are underwater with depths reaching 1-2 meters. ' +
    'River overflow has damaged infrastructure and displaced hundreds of families.'
  );
  doc.moveDown();

  doc.fontSize(14).text('CASUALTIES:', { underline: true });
  doc.fontSize(12);
  doc.text('- 2 confirmed fatalities (drowning)');
  doc.text('- 12 injured (minor injuries, mostly cuts and bruises)');
  doc.text('- No missing persons at this time');
  doc.moveDown();

  doc.fontSize(14).text('DAMAGE ASSESSMENT:', { underline: true });
  doc.fontSize(12);
  doc.text('- 150+ homes flooded and uninhabitable');
  doc.text('- Main road network disrupted - several bridges closed');
  doc.text('- Electrical infrastructure damaged - power outages affecting 5,000+ residents');
  doc.text('- Water contamination risk - sewage overflow reported');
  doc.moveDown();

  doc.fontSize(14).text('IMMEDIATE NEEDS:', { underline: true });
  doc.fontSize(12);
  doc.text('- Emergency evacuation boats');
  doc.text('- Temporary shelter and food supplies for 500+ displaced persons');
  doc.text('- Water purification equipment');
  doc.text('- Medical supplies for waterborne disease prevention');
  doc.text('- Sandbags and pumps for water management');
  doc.moveDown();

  doc.fontSize(12);
  doc.text('CURRENT STATUS: ONGOING RESPONSE');
  doc.text('Priority: HIGH');
  doc.moveDown();
  doc.text('Report Filed: 2025-02-03 09:20:00');

  doc.end();
  console.log(`✓ Generated: ${outputPath}`);
}

// Generate Test PDF 3: Fire Incident
function generateFirePDF() {
  const doc = new PDFDocument();
  const outputPath = path.join(outputDir, 'test-fire-report.pdf');
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(18).text('EMERGENCY FIELD REPORT', { align: 'center' });
  doc.fontSize(16).text('MARKET FIRE INCIDENT', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12);
  doc.text('Date: March 12, 2025');
  doc.text('Location: Merkato Market, Central District');
  doc.text('Coordinates: 9.0149°N, 38.7207°E');
  doc.text('Reporter: Fire Chief Daniel Bekele');
  doc.moveDown();

  doc.fontSize(14).text('INCIDENT SUMMARY:', { underline: true });
  doc.fontSize(12);
  doc.text(
    'Large fire broke out in the textile section of Merkato market at 11:45 AM. ' +
    'Flames spread rapidly through densely packed market stalls. ' +
    'Fire crews are on scene battling the blaze. Wind conditions complicating efforts.'
  );
  doc.moveDown();

  doc.fontSize(14).text('CASUALTIES:', { underline: true });
  doc.fontSize(12);
  doc.text('- 1 confirmed fatality');
  doc.text('- 28 injured (15 from smoke inhalation, 13 burns)');
  doc.text('- 5 firefighters treated for minor injuries');
  doc.moveDown();

  doc.fontSize(14).text('DAMAGE ASSESSMENT:', { underline: true });
  doc.fontSize(12);
  doc.text('- Approximately 200 market stalls destroyed');
  doc.text('- Fire spreading to adjacent buildings');
  doc.text('- Estimated economic loss: 50+ million ETB');
  doc.text('- Smoke affecting air quality in surrounding neighborhoods');
  doc.moveDown();

  doc.fontSize(14).text('IMMEDIATE NEEDS:', { underline: true });
  doc.fontSize(12);
  doc.text('- Additional fire engines and water tankers');
  doc.text('- Ambulances for smoke inhalation victims');
  doc.text('- Crowd control - large gathering of affected vendors');
  doc.text('- Economic relief assessment team');
  doc.moveDown();

  doc.fontSize(12);
  doc.text('CURRENT STATUS: FIRE NOT CONTAINED');
  doc.text('Priority: CRITICAL');
  doc.moveDown();
  doc.text('Report Filed: 2025-03-12 13:15:00');

  doc.end();
  console.log(`✓ Generated: ${outputPath}`);
}

// Generate all test PDFs
console.log('Generating test PDF field reports...\n');
generateEarthquakePDF();
generateFloodingPDF();
generateFirePDF();

console.log('\n✓ All test PDFs generated successfully!');
console.log(`Location: ${outputDir}`);