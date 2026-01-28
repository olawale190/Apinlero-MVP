#!/usr/bin/env node

/**
 * Àpínlẹ̀rọ Document Converter
 * Convert Markdown to PDF, Word (DOCX), or HTML
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function convertDocument(inputFile, outputFormat = 'pdf') {
  log('\n🔄 Àpínlẹ̀rọ Document Converter', 'blue');
  log('═'.repeat(50), 'blue');

  // Validate input file exists
  if (!fs.existsSync(inputFile)) {
    log(`\n❌ Error: File not found: ${inputFile}`, 'red');
    process.exit(1);
  }

  // Get file info
  const inputPath = path.resolve(inputFile);
  const inputDir = path.dirname(inputPath);
  const inputName = path.basename(inputPath, path.extname(inputPath));
  const outputFile = path.join(inputDir, `${inputName}.${outputFormat}`);

  log(`\n📄 Input:  ${path.basename(inputFile)}`, 'bright');
  log(`📦 Output: ${path.basename(outputFile)}`, 'bright');
  log(`🎯 Format: ${outputFormat.toUpperCase()}`, 'bright');

  try {
    // Check if pandoc is installed
    try {
      execSync('which pandoc', { stdio: 'ignore' });
    } catch (error) {
      log('\n❌ Error: Pandoc is not installed!', 'red');
      log('\nInstall with:', 'yellow');
      log('  macOS:   brew install pandoc', 'yellow');
      log('  Ubuntu:  sudo apt-get install pandoc', 'yellow');
      log('  Windows: Download from https://pandoc.org/installing.html', 'yellow');
      process.exit(1);
    }

    // Build pandoc command based on output format
    let pandocCmd;

    switch (outputFormat.toLowerCase()) {
      case 'pdf':
        // Try with wkhtmltopdf first (better for styled docs), fallback to basic pandoc
        try {
          execSync('which wkhtmltopdf', { stdio: 'ignore' });
          pandocCmd = `pandoc "${inputPath}" -o "${outputFile}" --pdf-engine=wkhtmltopdf -V margin-top=20mm -V margin-bottom=20mm -V margin-left=20mm -V margin-right=20mm`;
        } catch {
          // Fallback to basic pandoc (without LaTeX)
          log('\n⚠️  Note: Using basic PDF generation. For better quality, install wkhtmltopdf:', 'yellow');
          log('   brew install wkhtmltopdf', 'yellow');
          pandocCmd = `pandoc "${inputPath}" -o "${outputFile}"`;
        }
        break;

      case 'docx':
      case 'word':
        pandocCmd = `pandoc "${inputPath}" -o "${outputFile}"`;
        break;

      case 'html':
        pandocCmd = `pandoc "${inputPath}" -o "${outputFile}" --standalone --self-contained`;
        break;

      default:
        log(`\n❌ Unsupported format: ${outputFormat}`, 'red');
        log('Supported formats: pdf, docx, html', 'yellow');
        process.exit(1);
    }

    // Execute conversion
    log('\n⏳ Converting...', 'yellow');
    execSync(pandocCmd, { stdio: 'inherit' });

    // Check if output file was created
    if (!fs.existsSync(outputFile)) {
      throw new Error('Output file was not created');
    }

    // Get file size
    const stats = fs.statSync(outputFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);

    log(`\n✅ Success! Document converted.`, 'green');
    log(`\n📁 Location: ${outputFile}`, 'bright');
    log(`📊 Size: ${fileSizeInKB} KB`, 'bright');
    log('\n' + '═'.repeat(50), 'blue');

    return outputFile;
  } catch (error) {
    log(`\n❌ Conversion failed: ${error.message}`, 'red');
    log('\nTroubleshooting:', 'yellow');
    log('1. Check that pandoc is installed: pandoc --version', 'yellow');
    log('2. Verify the input file is valid markdown', 'yellow');
    log('3. Check you have write permissions in the output directory', 'yellow');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  log('\n🔄 Àpínlẹ̀rọ Document Converter', 'blue');
  log('═'.repeat(50), 'blue');
  console.log(`
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
  node convert-document.js notes.md --format html

Options:
  --help, -h    Show this help message
  `);
  process.exit(0);
}

const inputFile = args[0];
const formatIndex = args.indexOf('--format');
const outputFormat = formatIndex !== -1 && args[formatIndex + 1] ? args[formatIndex + 1] : 'pdf';

// Run conversion
convertDocument(inputFile, outputFormat);
