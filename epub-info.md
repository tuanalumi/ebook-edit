An **EPUB is basically a ZIP archive** with a specific internal structure.

Key facts:

* You can rename `book.epub` → `book.zip` and extract it.
* Inside you’ll usually find:

    * `META-INF/container.xml`
    * `content.opf` (metadata, spine, manifest)
    * HTML/XHTML files (chapters)
    * CSS, images, fonts

For Node.js, the usual approach:

1. **Unzip the EPUB**

    * Use `adm-zip` or `yauzl` (streaming, safer for large files).

2. **Parse and modify HTML/XHTML**

    * Use `cheerio` (jQuery-like) or `jsdom`.
    * EPUB HTML is often **XHTML**, so use XML mode when parsing.

3. **Zip it back**

    * Repack everything into a ZIP.
    * Critical rule: the `mimetype` file must:

        * Exist at root
        * Be the **first file**
        * Be **stored (no compression)**

Common Node stack:

* `yauzl` or `adm-zip` → unzip
* `cheerio` (`xmlMode: true`) → edit content
* `archiver` or `adm-zip` → rezip

Pitfalls to watch:

* Don’t break XML well-formedness.
* Preserve relative paths.
* Keep original encoding (usually UTF-8).
* Respect the `mimetype` rule or readers may reject the EPUB.
