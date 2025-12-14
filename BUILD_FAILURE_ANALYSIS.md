# Build Failure Analysis & Fix

## Problem

```
✖ Build failed
🤖 Android build failed:
Unknown error. See logs of the Fix gradlew build phase for more information.
```

## Root Cause Analysis

The "Fix gradlew build phase" error typically occurs when:

1. **Prebuild fails silently** - Config plugin has an error that prevents Android project generation
2. **Config plugin syntax error** - Plugin doesn't export correctly or has runtime errors
3. **Missing dependencies** - Required packages not installed
4. **Directory structure issues** - Native folders in wrong state

## Solution Steps

### Step 1: Test Prebuild Locally First

**CRITICAL:** Always test prebuild locally before building with EAS:

```bash
# Clean everything
rm -rf android ios .expo

# Test prebuild
npx expo prebuild --clean --platform android

# Check if it succeeded
ls android/gradlew
```

If prebuild fails locally, **fix those errors first** before building with EAS.

### Step 2: Verify Config Plugin

Check `android-manifest.plugin.js`:

```javascript
// ✅ CORRECT
const { withAndroidManifest } = require('expo/config-plugins');

const withAndroidForegroundService = (config) => {
  return withAndroidManifest(config, (config) => {
    // ... plugin code
    return config;
  });
};

module.exports = withAndroidForegroundService;
```

**Common Issues:**
- ❌ Using `@expo/config-plugins` instead of `expo/config-plugins`
- ❌ Using `async` when not needed
- ❌ Not returning the config
- ❌ Syntax errors

### Step 3: Clean EAS Configuration

Created a clean `eas.json`:
- Removed `gradleCommand` (let EAS use defaults)
- Simplified build profiles
- Added `appVersionSource` to prevent warnings

### Step 4: Verify Dependencies

Ensure all packages are installed:

```bash
npm install
```

Check for missing packages:
- `expo-system-ui` (for userInterfaceStyle)
- `@notifee/react-native` (for foreground service)
- All expo packages match SDK 54

### Step 5: Check Plugin Registration

Verify in `app.json`:

```json
{
  "expo": {
    "plugins": [
      "./android-manifest.plugin.js"
    ]
  }
}
```

## Diagnostic Commands

### Test Prebuild
```bash
rm -rf android ios && npx expo prebuild --clean --platform android
```

### Check Plugin Syntax
```bash
node -c android-manifest.plugin.js
```

### Verify Dependencies
```bash
npm list expo expo/config-plugins
```

### Check EAS Config
```bash
npx eas-cli build:configure
```

## Common Fixes

### Fix 1: Config Plugin Error

If prebuild fails with plugin error:

1. Check plugin file syntax
2. Verify import path: `expo/config-plugins`
3. Ensure plugin exports a function
4. Test plugin in isolation

### Fix 2: Missing Dependencies

```bash
# Install all dependencies
npm install

# Fix version mismatches
npx expo install --fix
```

### Fix 3: Clean Build

```bash
# Remove all generated files
rm -rf android ios .expo node_modules

# Reinstall
npm install

# Rebuild
npx expo prebuild --clean
```

### Fix 4: Simplify Config Plugin

If plugin continues to fail, temporarily remove it:

1. Comment out plugin in `app.json`
2. Test prebuild
3. If successful, the plugin is the issue
4. Fix plugin and re-enable

## Updated Files

1. ✅ **eas.json** - Cleaned and simplified
   - Removed `gradleCommand` (let EAS use defaults)
   - Simplified build profiles
   - Added `appVersionSource`

2. ✅ **android-manifest.plugin.js** - Already correct
   - Uses `expo/config-plugins`
   - Exports function correctly
   - Returns config properly

## Next Steps

### 1. Test Prebuild Locally

```bash
# Clean
rm -rf android ios .expo

# Test
npx expo prebuild --clean --platform android

# Verify
ls android/gradlew && echo "✅ Prebuild successful!"
```

### 2. If Prebuild Succeeds

Build with EAS:

```bash
npx eas-cli build --profile development --platform android
```

### 3. If Prebuild Fails

1. Read the error message carefully
2. Check which plugin/step failed
3. Fix the specific error
4. Retry prebuild
5. Only build with EAS after prebuild succeeds locally

## Why This Approach Works

- **Prebuild locally first** catches errors before EAS build
- **Clean eas.json** removes potential configuration conflicts
- **Simplified config** reduces points of failure
- **Test incrementally** isolates the problem

## Expected Outcome

After following these steps:

1. ✅ Prebuild runs successfully locally
2. ✅ `android/gradlew` file exists
3. ✅ EAS build completes without "Fix gradlew" error
4. ✅ APK is generated successfully

## If Still Failing

If prebuild still fails after these fixes:

1. Share the exact prebuild error output
2. Check EAS build logs for specific error messages
3. Try building without the custom plugin (temporarily)
4. Verify all dependencies are SDK 54 compatible
