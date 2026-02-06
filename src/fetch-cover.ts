import * as fs from "fs";

const OPEN_LIBRARY_COVER_URL = "https://covers.openlibrary.org/b/isbn";

/**
 * Fetches a book cover from Open Library by ISBN
 * @param isbn - ISBN-10 or ISBN-13
 * @param outputPath - Path to save the cover image
 * @returns true if cover was found and saved, false otherwise
 */
export async function fetchCover(
  isbn: string,
  outputPath: string,
): Promise<boolean> {
  const cleanIsbn = isbn.replace(/[-\s]/g, "");
  const url = `${OPEN_LIBRARY_COVER_URL}/${cleanIsbn}-L.jpg`;

  console.log(`Fetching cover from: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    console.log(`Cover fetch failed: HTTP ${response.status}`);
    return false;
  }

  const contentLength = response.headers.get("content-length");
  // Open Library returns a 1x1 transparent gif (~43 bytes) when cover not found
  if (contentLength && parseInt(contentLength, 10) < 1000) {
    console.log("Cover not found (placeholder image returned)");
    return false;
  }

  const buffer = await response.arrayBuffer();

  // Double-check actual size
  if (buffer.byteLength < 1000) {
    console.log("Cover not found (placeholder image returned)");
    return false;
  }

  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`Cover saved to: ${outputPath}`);
  return true;
}

/**
 * Extracts ISBN from a string, handling various formats
 * @param text - Text that may contain an ISBN
 * @returns Cleaned ISBN or null if not valid
 */
export function extractIsbnFromText(text: string): string | null {
  const cleaned = text.replace(/[-\s]/g, "").toUpperCase();
  // ISBN-13 (starts with 978 or 979) or ISBN-10
  if (/^(97[89])?\d{9}[\dX]$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}
