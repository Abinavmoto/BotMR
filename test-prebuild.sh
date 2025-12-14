#!/bin/bash

# Test Prebuild Script
# This script tests if prebuild works locally before building with EAS

set -e

echo "🧹 Step 1: Cleaning..."
rm -rf android ios .expo

echo ""
echo "📦 Step 2: Installing dependencies..."
npm install

echo ""
echo "🔧 Step 3: Fixing package versions..."
npx expo install --fix

echo ""
echo "🧪 Step 4: Testing prebuild..."
npx expo prebuild --clean --platform android

echo ""
echo "✅ Step 5: Verifying gradlew was created..."
if [ -f "android/gradlew" ]; then
  echo "✅ SUCCESS! gradlew exists."
  echo "✅ Prebuild completed successfully!"
  echo "✅ You can now build with EAS:"
  echo "   npx eas-cli build --profile development --platform android"
  exit 0
else
  echo "❌ FAILED! gradlew not found."
  echo "❌ Prebuild did not complete successfully."
  echo "❌ Check the errors above and fix them."
  echo "❌ DO NOT build with EAS until prebuild succeeds!"
  exit 1
fi
