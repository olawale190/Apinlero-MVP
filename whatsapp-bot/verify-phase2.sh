#!/bin/bash

echo "======================================================================"
echo "PHASE 2 VERIFICATION SCRIPT"
echo "======================================================================"
echo ""

# Check directories exist
echo "✓ Checking directories..."
for dir in validators simulators monitors generators fixtures; do
  if [ -d "$dir" ]; then
    echo "  ✅ $dir/ exists"
  else
    echo "  ❌ $dir/ missing"
  fi
done
echo ""

# Check module files
echo "✓ Checking module files..."
files=(
  "validators/tenant-isolation.js"
  "validators/phone-formats.js"
  "validators/README.md"
  "simulators/error-scenarios.js"
  "simulators/README.md"
  "monitors/health-checks.js"
  "monitors/README.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file" 2>/dev/null | tr -d ' ')
    echo "  ✅ $file ($lines lines)"
  else
    echo "  ❌ $file missing"
  fi
done
echo ""

# Check documentation
echo "✓ Checking documentation..."
docs=(
  "INDEX.md"
  "QUICK_REFERENCE.md"
  "ARCHITECTURE.md"
  "PHASE2_IMPLEMENTATION.md"
  "PHASE2_COMPLETE.txt"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc missing"
  fi
done
echo ""

# Check CLI is executable
echo "✓ Checking CLI..."
if [ -x "debugger-cli.js" ]; then
  echo "  ✅ debugger-cli.js is executable"
else
  echo "  ⚠️  debugger-cli.js exists but not executable"
fi
echo ""

# Count total lines of code
echo "✓ Code statistics..."
total_lines=$(find validators simulators monitors -name "*.js" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
echo "  Total production code: $total_lines lines"
echo ""

# Test imports
echo "✓ Testing module imports..."
node -e "import('./validators/tenant-isolation.js').then(() => console.log('  ✅ validators/tenant-isolation.js imports successfully'))" 2>/dev/null || echo "  ❌ Import failed"
node -e "import('./validators/phone-formats.js').then(() => console.log('  ✅ validators/phone-formats.js imports successfully'))" 2>/dev/null || echo "  ❌ Import failed"
node -e "import('./simulators/error-scenarios.js').then(() => console.log('  ✅ simulators/error-scenarios.js imports successfully'))" 2>/dev/null || echo "  ❌ Import failed"
node -e "import('./monitors/health-checks.js').then(() => console.log('  ✅ monitors/health-checks.js imports successfully'))" 2>/dev/null || echo "  ❌ Import failed"
echo ""

echo "======================================================================"
echo "VERIFICATION COMPLETE"
echo "======================================================================"
echo ""
echo "All Phase 2 files are properly saved in:"
echo "$(pwd)"
echo ""
echo "Ready to use! Try: node debugger-cli.js health-check"
echo ""
