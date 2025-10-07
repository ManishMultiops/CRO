#!/bin/bash

echo "=== DEBUG: Checking deployed files ==="
echo "Current directory: $(pwd)"
echo ""
echo "=== Full directory structure ==="
find . -type f -name "*.py" -o -name "*.json" -o -name "*.txt" -o -name "*.js" -o -name "*.md" | head -30
echo ""
echo "=== Checking common locations ==="
echo "CRO-Backend contents:"
ls -la CRO-Backend/ 2>/dev/null || echo "CRO-Backend not found"
echo ""
echo "CroBackend contents:"
ls -la CRO-Backend/CroBackend/ 2>/dev/null || echo "CRO-Backend/CroBackend not found"
echo ""
echo "Frontend contents:"
ls -la cro-phase2-frontend/ 2>/dev/null || echo "cro-phase2-frontend not found"
echo ""
echo "Root directory:"
ls -la
