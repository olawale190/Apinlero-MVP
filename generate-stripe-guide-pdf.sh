#!/bin/bash

# Script to generate PDF from CLIENT_STRIPE_SETUP_GUIDE.md
# This requires pandoc and a LaTeX engine (xelatex or pdflatex) to be installed

echo "📄 Generating Stripe Setup Guide PDF..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "❌ Error: pandoc is not installed"
    echo "Install with: brew install pandoc (macOS) or apt-get install pandoc (Linux)"
    exit 1
fi

# Check if xelatex is installed
if ! command -v xelatex &> /dev/null; then
    if ! command -v pdflatex &> /dev/null; then
        echo "❌ Error: No LaTeX engine found (xelatex or pdflatex)"
        echo "Install with:"
        echo "  macOS: brew install --cask mactex-no-gui"
        echo "  Linux: sudo apt-get install texlive-xetex"
        exit 1
    else
        PDF_ENGINE="pdflatex"
    fi
else
    PDF_ENGINE="xelatex"
fi

# Generate PDF
echo "Using PDF engine: $PDF_ENGINE"
echo "Converting markdown to PDF..."

pandoc project/docs/CLIENT_STRIPE_SETUP_GUIDE.md \
    -o Apinlero_Stripe_Setup_Guide.pdf \
    --pdf-engine=$PDF_ENGINE \
    -V geometry:margin=1in \
    -V fontsize=11pt \
    -V documentclass=article \
    --toc \
    --toc-depth=2 \
    --metadata title="Stripe Payment Setup Guide for Apinlero" \
    --metadata author="Apinlero" \
    --metadata date="$(date +%Y-%m-%d)"

if [ $? -eq 0 ]; then
    echo "✅ PDF generated successfully: Apinlero_Stripe_Setup_Guide.pdf"
    echo ""
    echo "You can now:"
    echo "  1. Email this PDF to clients"
    echo "  2. Upload it to your website"
    echo "  3. Share it via cloud storage"
    echo ""
    # Get file size
    FILE_SIZE=$(ls -lh Apinlero_Stripe_Setup_Guide.pdf | awk '{print $5}')
    echo "File size: $FILE_SIZE"
else
    echo "❌ Error generating PDF"
    echo ""
    echo "Alternative: You can open the HTML version in a browser and print to PDF:"
    echo "  1. Open Apinlero_Stripe_Setup_Guide.html in a web browser"
    echo "  2. Press Cmd+P (Mac) or Ctrl+P (Windows/Linux)"
    echo "  3. Select 'Save as PDF' as the printer"
    echo "  4. Save the PDF"
    exit 1
fi
