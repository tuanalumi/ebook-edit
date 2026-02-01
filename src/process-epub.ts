import { unzipEpub } from "./unzip-epub.js";
import { cleanEpub } from "./clean-epub.js";
import { zipEpub } from "./zip-epub.js";
import * as path from "path";
import * as fs from "fs";

/**
 * Processes an EPUB file: extracts contents, cleans HTML/CSS, and creates cleaned EPUB
 * @param epubPath - Path to the EPUB file
 */
export function processEpub(epubPath: string): void {
  console.log("Step 1: Extracting EPUB...");
  unzipEpub(epubPath);

  const outputDir = path.join(
    "extracted",
    path.basename(epubPath, path.extname(epubPath)),
  );

  console.log("\nStep 2: Cleaning HTML and CSS...");
  cleanEpub(outputDir);

  console.log("\nStep 3: Creating cleaned EPUB...");
  const outputEpubPath = epubPath.replace(/\.epub$/i, ".cleaned.epub");
  zipEpub(outputDir, outputEpubPath);

  console.log("\nStep 4: Cleaning up temporary files...");
  fs.rmSync(outputDir, { recursive: true, force: true });

  console.log("\nProcessing complete!");
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: ts-node process-epub.ts <epub-file>");
    console.error(
      "  Extracts to extracted/<epub-name>/ and creates <epub-file>.cleaned.epub",
    );
    process.exit(1);
  }

  const [epubPath] = args;

  try {
    if (!epubPath) throw new Error("Missing EPUB file path");

    processEpub(epubPath);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
