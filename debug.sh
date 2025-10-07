#!/bin/bash

echo "=== MINIMAL TEST START ==="
echo "Current directory: $(pwd)"
echo ""

echo "=== ALL FILES ==="
find . -type f | sort | head -30
echo ""

echo "=== SPECIFICALLY LOOKING FOR BACKEND ==="
find . -name "manage.py" -o -name "requirements.txt" 2>/dev/null
echo ""

echo "=== If no files above, creating test file ==="
echo "This is a test file" > test-deployment.txt
python3 -m http.server $PORT
