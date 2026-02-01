import * as cheerio from 'cheerio';
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
 * Removes all class attributes and CSS link tags from HTML file using cheerio
 */
function removeClassAttributes(htmlPath: string): void {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html, { xmlMode: true });

  // Remove class and style attributes from all elements
  $('*').removeAttr('class');
  $('*').removeAttr('style');

  // Remove all link tags that reference CSS files
  $('link[rel="stylesheet"]').remove();
  $('link[href$=".css"]').remove();

  // Remove spans with no attributes (unwrap their contents)
  let changed = true;
  while (changed) {
    changed = false;
    $('span').each((i, elem) => {
      if (Object.keys(elem.attribs).length === 0) {
        $(elem).replaceWith($(elem).contents());
        changed = true;
      }
    });
  }

  // Save back to file
  fs.writeFileSync(htmlPath, $.xml(), 'utf-8');
  console.log(`Cleaned: ${htmlPath}`);
}

/**
 * Removes CSS file references from content.opf
 */
function removeFromContentOpf(epubDir: string, cssFiles: string[]): void {
  const opfPath = path.join(epubDir, 'content.opf');
  if (!fs.existsSync(opfPath)) {
    console.log('content.opf not found, skipping OPF cleanup');
    return;
  }

  const opfContent = fs.readFileSync(opfPath, 'utf-8');
  const $ = cheerio.load(opfContent, { xmlMode: true });

  // Get relative paths of CSS files from the OPF directory
  const cssRelativePaths = cssFiles.map(cssFile =>
    path.relative(path.dirname(opfPath), cssFile)
  );

  // Remove manifest items that reference deleted CSS files
  cssRelativePaths.forEach(cssPath => {
    const normalizedPath = cssPath.replace(/\\/g, '/');
    $(`item[href="${normalizedPath}"]`).remove();
    $(`item[href="${cssPath}"]`).remove();
  });

  fs.writeFileSync(opfPath, $.xml(), 'utf-8');
  console.log(`Updated content.opf`);
}

/**
 * Cleans an extracted EPUB directory by removing CSS files and class attributes
 * @param epubDir - Directory containing extracted EPUB contents
 */
export function cleanEpub(epubDir: string): void {
  if (!fs.existsSync(epubDir)) {
    throw new Error(`Directory not found: ${epubDir}`);
  }

  // Find all HTML files
  const htmlFiles = findFiles(epubDir, ['.html', '.xhtml', '.htm']);
  console.log(`Found ${htmlFiles.length} HTML files`);

  // Remove class attributes from each HTML file
  for (const htmlFile of htmlFiles) {
    removeClassAttributes(htmlFile);
  }

  // Find and delete all CSS files
  const cssFiles = findFiles(epubDir, ['.css']);
  console.log(`Found ${cssFiles.length} CSS files to delete`);

  // Remove CSS references from content.opf before deleting files
  if (cssFiles.length > 0) {
    removeFromContentOpf(epubDir, cssFiles);
  }

  for (const cssFile of cssFiles) {
    fs.unlinkSync(cssFile);
    console.log(`Deleted: ${cssFile}`);
  }

  console.log(`Cleaning complete!`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: ts-node clean-epub.ts <epub-directory>');
    process.exit(1);
  }

  const [epubDir] = args;

  try {
    if (!epubDir) throw new Error('Missing directory path');

    cleanEpub(epubDir);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}