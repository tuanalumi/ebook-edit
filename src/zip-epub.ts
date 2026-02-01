import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";

/**
 * Creates an EPUB file from extracted directory
 * @param sourceDir - Directory containing EPUB contents
 * @param outputPath - Path where the EPUB file will be created
 */
export function zipEpub(sourceDir: string, outputPath: string): void {
  const zip = new AdmZip();

  // CRITICAL: Add mimetype first, uncompressed
  const mimetypePath = path.join(sourceDir, "mimetype");
  if (fs.existsSync(mimetypePath)) {
    zip.addLocalFile(mimetypePath, undefined, undefined, undefined);
    // Set no compression for mimetype
    const entries = zip.getEntries();
    if (entries?.[0]) {
      entries[0].header.method = 0; // 0 = stored (no compression)
    }
  }

  // Add all other files
  const addDirectory = (dirPath: string, zipPath: string = "") => {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      if (item === "mimetype") continue; // Already added

      const fullPath = path.join(dirPath, item);
      const relativePath = zipPath ? path.join(zipPath, item) : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        addDirectory(fullPath, relativePath);
      } else {
        zip.addLocalFile(fullPath, zipPath);
      }
    }
  };

  addDirectory(sourceDir);

  // Write EPUB file
  zip.writeZip(outputPath);
  console.log(`Created EPUB: ${outputPath}`);
}
