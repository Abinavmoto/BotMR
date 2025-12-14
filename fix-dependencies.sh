#!/bin/bash

echo "Cleaning project..."
rm -rf node_modules
rm -rf .expo
rm -rf ios android

echo "Clearing npm cache..."
npm cache clean --force

echo "Installing dependencies..."
npm install

echo "Fixing Expo dependencies..."
npx expo install --fix

echo "Done! Now run: npx expo start --clear"
