import { unzipEpub } from "./unzip-epub.js";
import { cleanEpub } from "./clean-epub.js";
import { zipEpub } from "./zip-epub.js";
import { fetchCover, extractIsbnFromText } from "./fetch-cover.js";
import * as cheerio from "cheerio";
import * as path from "path";
import * as fs from "fs";

interface ProcessOptions {
  fetchCover?: boolean;
}

/**
 * Extracts ISBN from content.opf metadata
 */
function extractIsbnFromOpf(opfPath: string): string | null {
  const content = fs.readFileSync(opfPath, "utf-8");
  const $ = cheerio.load(content, { xmlMode: true });

  // Look for dc:identifier elements
  const identifiers: string[] = [];
  $("dc\\:identifier, identifier").each((_, el) => {
    const scheme = $(el).attr("opf:scheme")?.toLowerCase();
    const text = $(el).text().trim();

    // Prioritize explicit ISBN scheme
    if (scheme === "isbn") {
      identifiers.unshift(text);
    } else {
      identifiers.push(text);
    }
  });

  // Try to extract valid ISBN from each identifier
  for (const id of identifiers) {
    const isbn = extractIsbnFromText(id);
    if (isbn) return isbn;
  }

  return null;
}

/**
 * Gets the cover image path from content.opf manifest
 */
function getCoverPath(opfPath: string): string | null {
  const content = fs.readFileSync(opfPath, "utf-8");
  const $ = cheerio.load(content, { xmlMode: true });
  const opfDir = path.dirname(opfPath);

  // Find cover item ID from metadata
  const coverMeta = $('meta[name="cover"]').attr("content");
  if (coverMeta) {
    const coverItem = $(`item[id="${coverMeta}"]`);
    const href = coverItem.attr("href");
    if (href) return path.join(opfDir, href);
  }

  // Fallback: look for item with id="cover" or properties="cover-image"
  const fallbackItem =
    $('item[id="cover"]').attr("href") ||
    $('item[properties="cover-image"]').attr("href");
  if (fallbackItem) return path.join(opfDir, fallbackItem);

  return null;
}

/**
 * Finds content.opf in extracted EPUB directory
 */
function findContentOpf(epubDir: string): string | null {
  const containerPath = path.join(epubDir, "META-INF", "container.xml");
  if (fs.existsSync(containerPath)) {
    const content = fs.readFileSync(containerPath, "utf-8");
    const $ = cheerio.load(content, { xmlMode: true });
    const rootfile = $("rootfile").attr("full-path");
    if (rootfile) return path.join(epubDir, rootfile);
  }

  // Fallback: check common locations
  const commonPaths = ["content.opf", "OEBPS/content.opf", "OPS/content.opf"];
  for (const p of commonPaths) {
    const fullPath = path.join(epubDir, p);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  return null;
}

/**
 * Processes an EPUB file: extracts contents, cleans HTML/CSS, and creates cleaned EPUB
 * @param epubPath - Path to the EPUB file
 * @param options - Processing options
 */
export async function processEpub(
  epubPath: string,
  options: ProcessOptions = {},
): Promise<void> {
  console.log("Step 1: Extracting EPUB...");
  unzipEpub(epubPath);

  const outputDir = path.join(
    "extracted",
    path.basename(epubPath, path.extname(epubPath)),
  );

  if (options.fetchCover) {
    console.log("\nStep 2: Fetching cover from Open Library...");
    const opfPath = findContentOpf(outputDir);
    if (opfPath) {
      const isbn = extractIsbnFromOpf(opfPath);
      if (isbn) {
        console.log(`Found ISBN: ${isbn}`);
        const coverPath = getCoverPath(opfPath);
        if (coverPath) {
          const success = await fetchCover(isbn, coverPath);
          if (!success) {
            console.log("Could not fetch cover, keeping original");
          }
        } else {
          console.log("No cover path found in manifest");
        }
      } else {
        console.log("No ISBN found in metadata");
      }
    } else {
      console.log("content.opf not found");
    }
  }

  console.log("\nStep 3: Cleaning HTML and CSS...");
  cleanEpub(outputDir);

  console.log("\nStep 4: Creating cleaned EPUB...");
  const outputEpubPath = epubPath.replace(/\.epub$/i, ".cleaned.epub");
  zipEpub(outputDir, outputEpubPath);

  console.log("\nStep 5: Cleaning up temporary files...");
  fs.rmSync(outputDir, { recursive: true, force: true });

  console.log("\nProcessing complete!");
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith("--"));
  const positional = args.filter((a) => !a.startsWith("--"));

  if (positional.length < 1) {
    console.error("Usage: tsx process-epub.ts <epub-file> [--fetch-cover]");
    console.error("  --fetch-cover  Fetch cover from Open Library by ISBN");
    console.error(
      "  Extracts to extracted/<epub-name>/ and creates <epub-file>.cleaned.epub",
    );
    process.exit(1);
  }

  const [epubPath] = positional;
  const options: ProcessOptions = {
    fetchCover: flags.includes("--fetch-cover"),
  };

  (async () => {
    try {
      if (!epubPath) throw new Error("Missing EPUB file path");
      await processEpub(epubPath, options);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  })();
}
