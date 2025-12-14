# Fix: gradlew Missing Error in EAS Build

## Problem

```
ENOENT: no such file or directory, open '/home/expo/workingdir/build/android/gradlew'
```

This error occurs when EAS Build tries to build the Android project but the native Android project hasn't been generated yet.

## Root Cause

EAS Build needs to run `expo prebuild` to generate the native Android project structure (including `gradlew`) before it can build. This happens automatically, but sometimes fails if:

1. Config plugins have errors
2. Build profile isn't configured correctly
3. Project structure issues

## Solution

### 1. Ensure EAS Build Configuration Exists

Created `eas.json` with proper build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    }
  }
}
```

### 2. Verify Config Plugin is Correct

The `android-manifest.plugin.js` should:
- Use `expo/config-plugins` (not `@expo/config-plugins`)
- Export a function that returns the modified config
- Be registered in `app.json` plugins array

### 3. Test Prebuild Locally First

Before building with EAS, test prebuild locally:

```bash
# Clean any existing native folders
rm -rf android ios

# Run prebuild
npx expo prebuild --clean

# Verify Android project was generated
ls android/gradlew
# Should show: android/gradlew (file exists)
```

If prebuild fails locally, fix those errors before building with EAS.

### 4. Rebuild with EAS

After fixing any prebuild issues:

```bash
npx eas-cli build --profile development --platform android
```

## Common Issues and Fixes

### Issue: Config Plugin Error

**Error:** Plugin fails during prebuild

**Fix:** Check `android-manifest.plugin.js`:
- Ensure it uses `expo/config-plugins`
- Verify the plugin exports a function
- Check for syntax errors

### Issue: Missing Dependencies

**Error:** Plugin can't find required modules

**Fix:** Ensure all dependencies are installed:
```bash
npm install
```

### Issue: Plugin Not Registered

**Error:** Plugin changes not applied

**Fix:** Verify plugin is in `app.json`:
```json
{
  "expo": {
    "plugins": [
      "./android-manifest.plugin.js"
    ]
  }
}
```

## Verification Steps

1. **Test prebuild locally:**
   ```bash
   npx expo prebuild --clean
   ```

2. **Verify Android project exists:**
   ```bash
   ls android/gradlew
   ```

3. **If successful, build with EAS:**
   ```bash
   npx eas-cli build --profile development --platform android
   ```

## Alternative: Use Managed Workflow

If prebuild continues to fail, you can:

1. Remove `android/` and `ios/` folders from git (they're in `.gitignore`)
2. Let EAS Build generate them automatically
3. Ensure all config is in `app.json` (not native files)

## Files Created/Modified

1. ✅ Created `eas.json` with build profiles
2. ✅ Verified `android-manifest.plugin.js` uses correct imports
3. ✅ Ensured plugin is registered in `app.json`

## Next Steps

1. Test prebuild locally: `npx expo prebuild --clean`
2. If successful, build with EAS: `npx eas-cli build --profile development --platform android`
3. If prebuild fails, fix the errors shown in the output

The `gradlew` file will be generated automatically during prebuild, which EAS Build runs before building your app.
