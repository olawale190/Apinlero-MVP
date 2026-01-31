# Stripe Setup Guide - README

## Overview

This directory contains a comprehensive, client-facing guide for setting up Stripe payments with Apinlero.

## Files Included

- **`CLIENT_STRIPE_SETUP_GUIDE.md`** - Main markdown guide (~1,550 lines)
- **`Apinlero_Stripe_Setup_Guide.html`** - HTML version (ready to view)
- **`generate-stripe-guide-pdf.sh`** - Script to generate PDF
- **`STRIPE_GUIDE_README.md`** - This file

## Guide Contents

The guide covers:
1. **Overview** - What Stripe is, why connect it, costs
2. **Prerequisites** - What clients need before starting
3. **Step 1: Create Stripe Account** - Sign up process
4. **Step 2: Get Test API Keys** - Finding and copying keys
5. **Step 3: Connect to Apinlero** - Entering keys, testing connection
6. **Step 4: Test Payment Setup** - Using test cards, placing orders
7. **Step 5: Business Verification** - Documents and approval process
8. **Step 6: Switch to Live Mode** - Going live with real payments
9. **Understanding Stripe Dashboard** - Navigating payments, payouts, reports
10. **Setting Up Webhooks** - Optional advanced feature
11. **Troubleshooting** - Common issues and solutions
12. **FAQ** - 20+ frequently asked questions
13. **Next Steps** - What to do after setup
14. **Support & Resources** - Contact information and helpful links

## How to Use

### Option 1: Share Markdown File (Easiest)

Send clients the markdown file directly:
- File: `project/docs/CLIENT_STRIPE_SETUP_GUIDE.md`
- Clients can open in any text editor
- Works on GitHub/GitLab (renders nicely)
- Can be printed from any markdown viewer

### Option 2: Share HTML Version (Recommended)

The HTML version is ready to use:
1. File: `Apinlero_Stripe_Setup_Guide.html`
2. Open in any web browser
3. Clients can bookmark it
4. Looks professional with styling

**To share:**
- Upload to your website: `https://yoursite.com/guides/stripe-setup.html`
- Send via email as attachment
- Host on cloud storage (Dropbox, Google Drive) and share link

### Option 3: Generate PDF Version (Most Professional)

#### Method A: Using the Script (Requires LaTeX)

If you have LaTeX installed:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP
./generate-stripe-guide-pdf.sh
```

This creates: `Apinlero_Stripe_Setup_Guide.pdf`

**Installing LaTeX (if needed):**

- **macOS:** `brew install --cask mactex-no-gui` (large download, ~4GB)
- **Linux:** `sudo apt-get install texlive-xetex`
- **Windows:** Download MiKTeX from https://miktex.org/

#### Method B: Print HTML to PDF (No Installation Needed)

Easiest way to create PDF without installing anything:

1. Open `Apinlero_Stripe_Setup_Guide.html` in web browser (Chrome, Firefox, Safari)
2. Press **Cmd+P** (Mac) or **Ctrl+P** (Windows/Linux)
3. In the print dialog:
   - Printer: Select **"Save as PDF"** or **"Microsoft Print to PDF"**
   - Layout: Portrait
   - Pages: All
   - Options: Enable "Background graphics" for colors
4. Click **"Save"**
5. Name it `Apinlero_Stripe_Setup_Guide.pdf`

**Result:** Professional PDF ready to distribute!

#### Method C: Online Conversion Tools

Upload the HTML file to online converters:
- https://www.adobe.com/acrobat/online/html-to-pdf.html
- https://cloudconvert.com/html-to-pdf
- https://www.sejda.com/html-to-pdf

**Privacy note:** Be careful with sensitive content when using online tools.

## Distributing to Clients

### Via Email

**Email Template:**

```
Subject: How to Set Up Stripe Payments for Your Apinlero Store

Hi [Client Name],

I'm excited to help you set up online card payments for your store!

Attached is a comprehensive guide that walks you through:
- Creating your Stripe account
- Connecting it to your Apinlero store
- Testing payments safely
- Going live when you're ready

The entire process takes about 15-20 minutes. Everything is explained in simple, step-by-step instructions.

If you have any questions while following the guide, just reply to this email or give us a call!

Best regards,
[Your Name]
Apinlero Support

---
Attachment: Apinlero_Stripe_Setup_Guide.pdf
```

### Via Dashboard (Recommended)

Add a link in the Stripe Settings page:
1. Edit `StripeSettings.tsx`
2. Add a "Download Guide" button
3. Link to hosted HTML or PDF

See the implementation section below for code example.

### Via Website

Host the guide on your public website:
- URL: `https://yourapinlero.com/guides/stripe-setup`
- Link from your documentation
- Reference in onboarding emails
- Include in client welcome packet

### Via Support Chat/WhatsApp

When clients ask about Stripe setup:
1. Send them the HTML or PDF file
2. Or send a link to the hosted version
3. Offer to walk them through it on a call if needed

## Customization

### Branding the Guide

To add your company branding:

**For HTML:**
1. Open `Apinlero_Stripe_Setup_Guide.html`
2. Add your logo in the header section
3. Customize colors with CSS
4. Add your support contact info

**For PDF (via HTML):**
1. Customize the HTML first
2. Then use "Print to PDF" method
3. Result: Branded PDF

### Updating Content

When Stripe or Apinlero UI changes:

1. Edit `project/docs/CLIENT_STRIPE_SETUP_GUIDE.md`
2. Update the affected sections
3. Update version number and "Last Updated" date at top
4. Regenerate HTML: `pandoc project/docs/CLIENT_STRIPE_SETUP_GUIDE.md -o Apinlero_Stripe_Setup_Guide.html --standalone --toc --toc-depth=2`
5. Regenerate PDF using one of the methods above
6. Redistribute to clients

### Adding Your Logo to HTML

Add this to the HTML file after the `<body>` tag:

```html
<div style="text-align: center; margin: 20px 0;">
  <img src="your-logo.png" alt="Apinlero Logo" style="max-width: 200px;">
  <h1>Stripe Payment Setup Guide</h1>
</div>
```

## Integration with StripeSettings Component

To add a "Download Guide" button in the Stripe Settings page:

**File:** `project/src/pages/StripeSettings.tsx`

Add this button in the instructions section:

```tsx
<div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
  <CheckCircle2 size={20} />
  <div>
    <p className="font-medium">New to Stripe?</p>
    <p>
      Download our{' '}
      <a
        href="/guides/Apinlero_Stripe_Setup_Guide.pdf"
        download
        className="underline font-semibold hover:text-green-700"
      >
        complete setup guide
      </a>
      {' '}for step-by-step instructions.
    </p>
  </div>
</div>
```

**Host the guide:**
- Place PDF in `public/guides/` directory
- Or link to external hosting (S3, CDN, your website)

## Maintenance Schedule

**Quarterly (Every 3 months):**
- Check Stripe Dashboard UI hasn't changed significantly
- Verify all screenshots/descriptions still accurate
- Test all links are working
- Check for new Stripe features to document

**When Apinlero Updates:**
- Update sections related to Apinlero UI
- Test navigation paths still correct
- Update version number and date

**When Support Patterns Emerge:**
- If clients ask same question repeatedly, add to FAQ
- If common issue arises, add to Troubleshooting
- If confusion around a section, clarify that section

## Translation

To translate the guide to other languages:

1. Copy `CLIENT_STRIPE_SETUP_GUIDE.md` to `CLIENT_STRIPE_SETUP_GUIDE_[LANG].md`
2. Translate all content
3. Keep same structure and formatting
4. Generate HTML/PDF using the same methods
5. Name outputs with language suffix (e.g., `Guide_FR.pdf`)

**Example for French:**
- Markdown: `CLIENT_STRIPE_SETUP_GUIDE_FR.md`
- HTML: `Apinlero_Stripe_Setup_Guide_FR.html`
- PDF: `Apinlero_Stripe_Setup_Guide_FR.pdf`

## Version History

- **v1.0** (January 27, 2026) - Initial comprehensive guide
  - 14 sections covering complete setup process
  - Troubleshooting and FAQ sections
  - Test mode and live mode instructions
  - Business verification guidance

## Support

**For guide-related questions:**
- Internal: Contact development team
- Clients: Direct to support@apinlero.com

**For content suggestions:**
- Submit feedback via support email
- Track improvement ideas in project management
- Update guide based on client feedback

## Legal & Compliance

**Disclaimer:** This guide is provided for informational purposes. Stripe's terms, fees, and processes may change. Always refer to official Stripe documentation for the most current information.

**Privacy:** When sharing the guide externally, ensure:
- No actual API keys are shown (only examples)
- No real client data in screenshots (if added in future)
- Compliance with data protection regulations

## Statistics

- **Document size:** ~1,550 lines
- **Word count:** ~12,000 words
- **Reading time:** ~45-60 minutes (full guide)
- **Completion time:** 15-20 minutes (actual setup)
- **Sections:** 14 major sections
- **FAQ answers:** 20+ questions covered
- **Troubleshooting scenarios:** 10+ issues addressed

---

**Questions?** Contact support@apinlero.com or refer to the internal STRIPE_INTEGRATION_COMPLETE.md document for developer-level details.
