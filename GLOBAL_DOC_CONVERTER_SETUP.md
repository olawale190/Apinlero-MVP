# Global Document Converter - Setup Complete ✅

## What Was Installed

Your document conversion skill is now available **globally** - you can use it from anywhere on your system!

### Installation Locations

1. **Global Skill Definition**
   - Location: `~/.claude/skills/doc-converter.md`
   - Available to all Claude Code sessions

2. **Global Script**
   - Location: `~/.claude/scripts/convert-document.cjs`
   - Backup script location

3. **Global Command** ⭐
   - Location: `/usr/local/bin/convert-doc`
   - Executable from any directory
   - No need to specify full path

## How to Use

### Quick Usage (From Anywhere!)

```bash
# Convert any markdown file to PDF
convert-doc myfile.md

# Convert to Word
convert-doc myfile.md --format docx

# Convert to HTML
convert-doc myfile.md --format html

# Get help
convert-doc --help

# Check version
convert-doc --version
```

### Examples

```bash
# Example 1: Convert from your Desktop
cd ~/Desktop
convert-doc project-proposal.md

# Example 2: Convert from Downloads
cd ~/Downloads
convert-doc meeting-notes.md --format docx

# Example 3: Convert from any project directory
cd /path/to/your/project
convert-doc README.md --format pdf
```

## Supported Formats

| Format | Extension | Description | Quality |
|--------|-----------|-------------|---------|
| **PDF** | `.pdf` | Portable Document Format | High (via Chrome) |
| **Word** | `.docx` | Microsoft Word Document | High |
| **HTML** | `.html` | Web Page (standalone) | High |

## Features

✅ **Works from any directory** - No need to navigate to specific folders
✅ **Automatic path resolution** - Converts files relative to current directory
✅ **Multiple formats** - PDF, DOCX, HTML
✅ **High-quality output** - Uses Chrome headless for PDFs
✅ **Color-coded output** - Easy to read terminal feedback
✅ **Error handling** - Clear error messages and troubleshooting tips
✅ **File size reporting** - Shows output file size
✅ **Smart fallbacks** - Tries multiple conversion methods

## Technical Details

### Conversion Methods

1. **PDF Conversion:**
   - Primary: Markdown → HTML → PDF (via Chrome headless)
   - Fallback: Markdown → PDF (via pandoc)
   - Best quality with proper formatting

2. **Word Conversion:**
   - Direct: Markdown → DOCX (via pandoc)
   - Fully editable output

3. **HTML Conversion:**
   - Direct: Markdown → HTML (via pandoc)
   - Standalone, self-contained files

### Dependencies

**Required:**
- Node.js (installed ✅)
- Pandoc (installed ✅)

**Optional (for better PDF quality):**
- Google Chrome (installed ✅)
- LaTeX (pdflatex) - for alternative PDF generation

## Claude Code Skill

You can also use this via Claude Code:

```
/doc-converter
```

The skill will guide you through the conversion process interactively.

## Common Use Cases

### 1. Client Documentation
```bash
convert-doc client-guide.md
# Send the PDF to clients
```

### 2. Technical Documentation
```bash
convert-doc API-docs.md --format html
# Host the HTML on your website
```

### 3. Reports and Proposals
```bash
convert-doc business-proposal.md --format docx
# Edit in Word for final touches
```

### 4. Meeting Notes
```bash
convert-doc meeting-2026-01-27.md --format pdf
# Archive or share with team
```

## Batch Conversion

Convert multiple files at once:

```bash
# Convert all markdown files in current directory to PDF
for file in *.md; do
  convert-doc "$file" --format pdf
done

# Convert specific files to Word
convert-doc file1.md --format docx
convert-doc file2.md --format docx
convert-doc file3.md --format docx
```

## Troubleshooting

### Command not found
If you get "command not found", ensure `/usr/local/bin` is in your PATH:

```bash
echo $PATH | grep "/usr/local/bin"
```

If not found, add to your shell profile:

```bash
# For bash (~/.bash_profile or ~/.bashrc)
export PATH="/usr/local/bin:$PATH"

# For zsh (~/.zshrc)
export PATH="/usr/local/bin:$PATH"
```

Then reload:
```bash
source ~/.zshrc  # or ~/.bash_profile
```

### Pandoc not found
Install pandoc:
```bash
brew install pandoc
```

### PDF conversion fails
Ensure Google Chrome is installed, or install LaTeX:
```bash
brew install --cask basictex
```

### Permission denied
Make sure the script is executable:
```bash
chmod +x /usr/local/bin/convert-doc
```

## Updating the Converter

To update the global command:

```bash
# Copy new version
cp /path/to/new/convert-document.cjs /usr/local/bin/convert-doc
chmod +x /usr/local/bin/convert-doc
```

## Uninstalling

If you want to remove the global installation:

```bash
# Remove global command
rm /usr/local/bin/convert-doc

# Remove global skill (optional)
rm ~/.claude/skills/doc-converter.md

# Remove global script (optional)
rm ~/.claude/scripts/convert-document.cjs
```

## Examples from Your Project

### Stripe Client Guide (Already Converted ✅)
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP
convert-doc STRIPE_CLIENT_SETUP_GUIDE.md
# Output: STRIPE_CLIENT_SETUP_GUIDE.pdf (276 KB)
```

### Session Summaries
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP
convert-doc SESSION_SUMMARY_2026-01-27.md --format pdf
```

### Business Plan
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/docs
convert-doc 10_BUSINESS_PLAN.md --format docx
```

## Integration with Other Tools

### Git Hook (Auto-convert on commit)
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Auto-convert README to PDF on commit
if git diff --cached --name-only | grep -q "README.md"; then
  convert-doc README.md --format pdf
  git add README.pdf
fi
```

### npm Script
Add to `package.json`:
```json
{
  "scripts": {
    "docs:pdf": "convert-doc README.md --format pdf",
    "docs:word": "convert-doc README.md --format docx",
    "docs:html": "convert-doc README.md --format html"
  }
}
```

### Makefile
Add to `Makefile`:
```makefile
docs:
	convert-doc README.md --format pdf
	convert-doc GUIDE.md --format pdf
```

## Tips and Tricks

### 1. Quick Conversion
```bash
# Create an alias for faster typing
alias pdf='convert-doc'
alias docx='convert-doc --format docx'

# Then use:
pdf myfile.md
docx myfile.md
```

### 2. Open After Conversion
```bash
# Convert and open immediately
convert-doc file.md && open file.pdf
```

### 3. Custom Output Location
```bash
# Convert and move to specific folder
convert-doc file.md
mv file.pdf ~/Documents/PDFs/
```

### 4. Batch with Renaming
```bash
# Convert with custom naming
for file in *.md; do
  convert-doc "$file" --format pdf
  mv "${file%.md}.pdf" "archived-${file%.md}.pdf"
done
```

## Success! 🎉

Your document converter is now:
- ✅ Installed globally
- ✅ Available from any directory
- ✅ Ready to use with any markdown file
- ✅ Integrated with Claude Code skills

**Try it now:**
```bash
convert-doc --help
```

---

**Version:** 1.0.0
**Created:** January 27, 2026
**Status:** Active and Ready to Use
**Command:** `convert-doc`
