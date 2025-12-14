# Debug Prebuild Failure - gradlew Missing

## Current Issue

```
ENOENT: no such file or directory, open '/home/expo/workingdir/build/android/gradlew'
```

This means prebuild is failing during EAS Build, so the Android project isn't being generated.

## Root Cause

The "Fix gradlew" phase runs `expo prebuild` to generate the Android project. If prebuild fails, `gradlew` is never created, causing the build to fail.

## Immediate Fixes Applied

### 1. ✅ Fixed expo-system-ui Version

**Changed:** `~4.0.4` → `~6.0.9` (correct for SDK 54)

This was causing `expo doctor` to fail, which might prevent prebuild from running.

## Debugging Steps

### Step 1: Test Prebuild Locally (MANDATORY)

```bash
# Clean everything
rm -rf android ios .expo

# Install correct dependencies
npm install

# Test prebuild with verbose output
npx expo prebuild --clean --platform android --verbose
```

**Look for:**
- ❌ Any plugin errors
- ❌ Missing dependencies
- ❌ Syntax errors
- ✅ "Successfully generated native project"

### Step 2: Check Plugin Syntax

```bash
# Test plugin can be loaded
node -c android-manifest.plugin.js
```

### Step 3: Verify Plugin Registration

Check `app.json` has:
```json
{
  "expo": {
    "plugins": [
      "./android-manifest.plugin.js"
    ]
  }
}
```

### Step 4: Test Without Custom Plugin (Isolation)

If prebuild still fails, temporarily disable the plugin:

1. Comment out plugin in `app.json`:
   ```json
   "plugins": [
     // "./android-manifest.plugin.js",  // Temporarily disabled
   ]
   ```

2. Test prebuild:
   ```bash
   rm -rf android ios && npx expo prebuild --clean --platform android
   ```

3. If prebuild succeeds without plugin:
   - Plugin is the issue
   - Fix plugin and re-enable

4. If prebuild still fails:
   - Issue is elsewhere (dependencies, expo version, etc.)

## Common Causes

### Cause 1: Config Plugin Error

**Symptoms:**
- Prebuild fails with plugin-related error
- Error mentions `android-manifest.plugin.js`

**Fix:**
- Check plugin syntax
- Verify `expo/config-plugins` import
- Ensure plugin exports function correctly

### Cause 2: Missing Dependencies

**Symptoms:**
- "Cannot find module" errors
- Package version mismatches

**Fix:**
```bash
npm install
npx expo install --fix
```

### Cause 3: Expo SDK Mismatch

**Symptoms:**
- Multiple version mismatches in `expo doctor`
- Prebuild fails silently

**Fix:**
```bash
npx expo install --fix
```

### Cause 4: Corrupted Native Folders

**Symptoms:**
- Prebuild partially succeeds but gradlew missing
- Incomplete Android project

**Fix:**
```bash
rm -rf android ios .expo
npx expo prebuild --clean --platform android
```

## Quick Diagnostic Script

```bash
#!/bin/bash
echo "🧹 Cleaning..."
rm -rf android ios .expo

echo "📦 Installing dependencies..."
npm install

echo "🔧 Fixing versions..."
npx expo install --fix

echo "🧪 Testing prebuild..."
npx expo prebuild --clean --platform android --verbose

if [ -f "android/gradlew" ]; then
  echo "✅ Prebuild successful! gradlew exists."
  echo "✅ Ready for EAS build"
else
  echo "❌ Prebuild failed! gradlew not found."
  echo "❌ Check errors above and fix before building with EAS"
fi
```

## Next Steps

1. **Run prebuild locally first** - This is critical
2. **Fix any errors** shown in prebuild output
3. **Only then** build with EAS

## If Prebuild Succeeds Locally But EAS Fails

If prebuild works locally but EAS still fails:

1. Check EAS build logs for specific error
2. Compare local vs EAS environment
3. Ensure all files are committed (including `package.json` changes)
4. Try building with `--clear-cache`:
   ```bash
   npx eas-cli build --profile development --platform android --clear-cache
   ```

## Files to Check

1. ✅ `package.json` - `expo-system-ui` version fixed
2. ✅ `android-manifest.plugin.js` - Verify syntax
3. ✅ `app.json` - Plugin registered correctly
4. ✅ `eas.json` - Clean configuration

## Critical: Test Locally First

**DO NOT** build with EAS until prebuild succeeds locally. The error will be much clearer when running prebuild locally.
