import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extracts an EPUB file to extracted/<epub-name>/
 * @param epubPath - Path to the EPUB file
 */
export function unzipEpub(epubPath: string): void {
  if (!fs.existsSync(epubPath)) {
    throw new Error(`EPUB file not found: ${epubPath}`);
  }

  // Always extract to extracted/<epub-name>/
  const outputDir = path.join(
    'extracted',
    path.basename(epubPath, path.extname(epubPath))
  );

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const zip = new AdmZip(epubPath);
  zip.extractAllTo(outputDir, true);

  console.log(`Extracted ${epubPath} to ${outputDir}`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: ts-node unzip-epub.ts <epub-file>');
    console.error('  Extracts to extracted/<epub-name>/');
    process.exit(1);
  }

  const [epubPath] = args;

  try {
    if (!epubPath) throw new Error('Missing EPUB file path');

    unzipEpub(epubPath);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
