# AGENTS.md

## Commands
- **Run script**: `npx tsx src/<script>.ts`
- **Typecheck**: `npx tsc --noEmit`
- **Format**: `npx prettier --write .`

## Architecture
Simple TypeScript CLI tools for EPUB manipulation:
- `src/unzip-epub.ts` - Extract EPUB archives
- `src/zip-epub.ts` - Create EPUB from directory (proper mimetype handling)
- `src/clean-epub.ts` - Remove CSS/class attributes from EPUB content
- `src/process-epub.ts` - Main processing workflow

Uses `cheerio` for HTML/XML parsing and Node.js `fs` for file operations.

## Code Style
- ESM modules (`"type": "module"` in package.json)
- Use `import * as` for Node.js builtins (fs, path)
- Strict TypeScript with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- JSDoc comments for exported functions
- CLI entry point pattern: `if (import.meta.url === \`file://${process.argv[1]}\`)`
- Error handling: throw Error with descriptive messages, catch and log at CLI level
