# Àpínlẹ̀rọ Document Converter
## Convert Markdown to PDF, Word, or HTML

## Purpose
Convert markdown documents to professional PDF, Word (DOCX), or HTML formats for sharing with clients, team members, or documentation purposes.

## Usage
```
/doc-converter
/doc-converter [file-path]
/doc-converter [file-path] --format pdf
/doc-converter [file-path] --format docx
/doc-converter [file-path] --format html
```

## Prerequisites
- Node.js installed
- Input file must exist (markdown, txt, or other supported formats)
- Output directory must be writable

## Commands

| Command | Description |
|---------|-------------|
| `/doc-converter` | Interactive mode - prompts for file and format |
| `/doc-converter [file]` | Convert specified file (auto-detects format) |
| `/doc-converter [file] --format pdf` | Convert to PDF |
| `/doc-converter [file] --format docx` | Convert to Word |
| `/doc-converter [file] --format html` | Convert to HTML |
| `/doc-converter --help` | Show help |

## Implementation

### Step 1: Check for Conversion Tools

First, check if pandoc (universal document converter) is installed:

```bash
which pandoc
```

If not installed, install it:

**macOS:**
```bash
brew install pandoc
```

**Ubuntu/Debian:**
```bash
sudo apt-get install pandoc
```

**Windows:**
Download from: https://pandoc.org/installing.html

### Step 2: Install Additional Dependencies

For PDF conversion, you'll need a LaTeX engine:

**macOS:**
```bash
brew install --cask basictex
```

**Ubuntu/Debian:**
```bash
sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra
```

For better styling, install additional fonts:
```bash
brew install --cask font-dejavu
```

### Step 3: Create Conversion Script

Create a Node.js script to handle conversions:

```javascript
// scripts/convert-document.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function convertDocument(inputFile, outputFormat = 'pdf') {
  // Validate input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  // Get file info
  const inputPath = path.resolve(inputFile);
  const inputDir = path.dirname(inputPath);
  const inputName = path.basename(inputPath, path.extname(inputPath));
  const outputFile = path.join(inputDir, `${inputName}.${outputFormat}`);

  console.log(`Converting: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log(`Format: ${outputFormat.toUpperCase()}`);

  try {
    // Build pandoc command based on output format
    let pandocCmd;

    switch (outputFormat) {
      case 'pdf':
        pandocCmd = `pandoc "${inputPath}" -o "${outputFile}" --pdf-engine=pdflatex -V geometry:margin=1in -V fontsize=11pt`;
        break;

      case 'docx':
        pandocCmd = `pandoc "${inputPath}" -o "${outputFile}" --reference-doc=custom-reference.docx`;
        break;

      case 'html':
        pandocCmd = `pandoc "${inputPath}" -o "${outputFile}" --standalone --css=style.css`;
        break;

      default:
        console.error(`Unsupported format: ${outputFormat}`);
        process.exit(1);
    }

    // Execute conversion
    console.log('Converting...');
    execSync(pandocCmd, { stdio: 'inherit' });

    console.log(`✅ Success! Created: ${outputFile}`);

    // Get file size
    const stats = fs.statSync(outputFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`File size: ${fileSizeInKB} KB`);

    return outputFile;
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const inputFile = args[0];
const formatIndex = args.indexOf('--format');
const outputFormat = formatIndex !== -1 ? args[formatIndex + 1] : 'pdf';

if (!inputFile || args.includes('--help')) {
  console.log(`
Àpínlẹ̀rọ Document Converter
=============================

Usage:
  node convert-document.js <input-file> [--format <format>]

Formats:
  pdf   - PDF document (default)
  docx  - Microsoft Word document
  html  - HTML web page

Examples:
  node convert-document.js README.md
  node convert-document.js guide.md --format pdf
  node convert-document.js docs.md --format docx
  `);
  process.exit(0);
}

convertDocument(inputFile, outputFormat);
```

### Step 4: Alternative - Use markdown-pdf (Node.js only)

If you prefer a pure Node.js solution without pandoc:

```bash
npm install -g markdown-pdf
```

Then convert:
```bash
markdown-pdf input.md -o output.pdf
```

### Step 5: Alternative - Use Playwright for High-Quality PDFs

For the best-looking PDFs with full CSS support:

```javascript
// scripts/convert-to-pdf-playwright.js
const fs = require('fs');
const { chromium } = require('playwright');
const { marked } = require('marked');

async function convertMarkdownToPDF(inputFile, outputFile) {
  // Read markdown file
  const markdown = fs.readFileSync(inputFile, 'utf-8');

  // Convert to HTML
  const htmlContent = marked.parse(markdown);

  // Create styled HTML
  const styledHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        h1, h2, h3 { color: #2c3e50; margin-top: 24px; }
        h1 { border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #3498db; margin: 0; padding-left: 20px; color: #555; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul, ol { padding-left: 30px; }
        li { margin: 8px 0; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  // Launch browser and create PDF
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(styledHTML);
  await page.pdf({
    path: outputFile,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true,
  });
  await browser.close();

  console.log(`✅ PDF created: ${outputFile}`);
}

// Usage
const inputFile = process.argv[2];
const outputFile = process.argv[3] || inputFile.replace('.md', '.pdf');

if (!inputFile) {
  console.log('Usage: node convert-to-pdf-playwright.js <input.md> [output.pdf]');
  process.exit(1);
}

convertMarkdownToPDF(inputFile, outputFile);
```

Install dependencies:
```bash
npm install playwright marked
```

## Code Snippets

### Quick PDF Conversion (Using Pandoc)
```bash
# Basic conversion
pandoc input.md -o output.pdf

# With custom styling
pandoc input.md -o output.pdf \
  --pdf-engine=pdflatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article

# Add table of contents
pandoc input.md -o output.pdf --toc --toc-depth=2
```

### Quick Word Conversion
```bash
# Basic conversion
pandoc input.md -o output.docx

# With custom template
pandoc input.md -o output.docx --reference-doc=template.docx
```

### Quick HTML Conversion
```bash
# Basic conversion
pandoc input.md -o output.html

# Standalone HTML with CSS
pandoc input.md -o output.html --standalone --css=style.css

# Self-contained HTML (embedded images)
pandoc input.md -o output.html --self-contained
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `pandoc: command not found` | Pandoc not installed | Run `brew install pandoc` (macOS) |
| `pdflatex not found` | LaTeX not installed | Run `brew install --cask basictex` |
| `File not found` | Invalid input path | Check file path is correct |
| `Permission denied` | No write access | Check output directory permissions |
| `Conversion failed` | Invalid markdown syntax | Check markdown is valid |

## Examples

### Example 1: Convert Stripe Guide to PDF
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP
node scripts/convert-document.js STRIPE_CLIENT_SETUP_GUIDE.md --format pdf
```

Expected output:
```
Converting: STRIPE_CLIENT_SETUP_GUIDE.md
Output: STRIPE_CLIENT_SETUP_GUIDE.pdf
Format: PDF
Converting...
✅ Success! Created: STRIPE_CLIENT_SETUP_GUIDE.pdf
File size: 245.67 KB
```

### Example 2: Convert to Word Document
```bash
node scripts/convert-document.js STRIPE_CLIENT_SETUP_GUIDE.md --format docx
```

### Example 3: Batch Conversion
```bash
# Convert all markdown files to PDF
for file in *.md; do
  pandoc "$file" -o "${file%.md}.pdf"
done
```

## Related Skills
- skill-creator (Create new skills)
- version-control (Track document versions)
- deploy-vercel (Deploy documentation sites)

## Troubleshooting

### PDF Conversion Fails
**Cause:** LaTeX engine not installed
**Solution:**
```bash
brew install --cask basictex
# Add to PATH
export PATH="/Library/TeX/texbin:$PATH"
```

### Fonts Look Bad in PDF
**Cause:** Missing font packages
**Solution:**
```bash
# Install additional fonts
brew install --cask font-dejavu
brew install --cask font-liberation
```

### Large File Size
**Cause:** Embedded images not optimized
**Solution:**
- Optimize images before conversion
- Use `--dpi=150` flag with pandoc
- Compress PDF after creation: `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=output-compressed.pdf input.pdf`

---
*Generated by Apinlero Skill Creator*
