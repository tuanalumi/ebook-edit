import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively finds all files with specific extensions in a directory
 */
function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Decodes numeric character references (&#xHEX; and &#DEC;) to Unicode.
 * Preserves XML-required entities (&amp; &lt; &gt; &quot; &apos;).
 */
function decodeNumericEntities(content: string): string {
  // Decode hex references: &#xe0; -> à
  let result = content.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) => {
    return String.fromCodePoint(parseInt(hex, 16));
  });

  // Decode decimal references: &#233; -> é
  result = result.replace(/&#(\d+);/g, (_match, dec: string) => {
    return String.fromCodePoint(parseInt(dec, 10));
  });

  return result;
}

/**
 * Decodes numeric character references to Unicode in all HTML/XHTML files
 * in an extracted EPUB directory
 * @param epubDir - Directory containing extracted EPUB contents
 */
export function decodeEpubEntities(epubDir: string): void {
  if (!fs.existsSync(epubDir)) {
    throw new Error(`Directory not found: ${epubDir}`);
  }

  const htmlFiles = findFiles(epubDir, ['.html', '.xhtml', '.htm']);
  console.log(`Found ${htmlFiles.length} HTML files`);

  let changed = 0;
  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf-8');
    const decoded = decodeNumericEntities(content);

    if (decoded !== content) {
      fs.writeFileSync(htmlFile, decoded, 'utf-8');
      console.log(`Decoded: ${htmlFile}`);
      changed++;
    }
  }

  console.log(`Decoded entities in ${changed} file(s)`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx src/decode-entities.ts <epub-directory>');
    process.exit(1);
  }

  const [epubDir] = args;

  try {
    if (!epubDir) throw new Error('Missing directory path');
    decodeEpubEntities(epubDir);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
