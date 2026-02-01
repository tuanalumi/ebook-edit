import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * Creates an EPUB file from extracted directory using the system `zip` command.
 * This ensures proper EPUB structure with mimetype stored first and uncompressed.
 * @param sourceDir - Directory containing EPUB contents
 * @param outputPath - Path where the EPUB file will be created
 */
export function zipEpub(sourceDir: string, outputPath: string): void {
  const absoluteOutput = path.resolve(outputPath);

  // Remove existing file if present
  if (fs.existsSync(absoluteOutput)) {
    fs.unlinkSync(absoluteOutput);
  }

  // CRITICAL: Add mimetype first, stored (no compression)
  const mimetypePath = path.join(sourceDir, "mimetype");
  if (fs.existsSync(mimetypePath)) {
    execSync(`zip -X0 "${absoluteOutput}" mimetype`, {
      cwd: sourceDir,
      stdio: "pipe",
    });
  }

  // Add META-INF directory (required for EPUB)
  const metaInfPath = path.join(sourceDir, "META-INF");
  if (fs.existsSync(metaInfPath)) {
    execSync(`zip -Xr9 "${absoluteOutput}" META-INF`, {
      cwd: sourceDir,
      stdio: "pipe",
    });
  }

  // Add all other files (excluding mimetype and META-INF)
  execSync(
    `zip -Xr9 "${absoluteOutput}" . -x mimetype -x "META-INF/*" -x META-INF`,
    {
      cwd: sourceDir,
      stdio: "pipe",
    }
  );

  console.log(`Created EPUB: ${outputPath}`);
}
