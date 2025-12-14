# Clean Build Steps - Fix gradlew Error

## Quick Fix Checklist

Follow these steps in order:

### ✅ Step 1: Clean Everything

```bash
# Remove all generated files
rm -rf android ios .expo

# Clean npm cache (optional)
npm cache clean --force
```

### ✅ Step 2: Verify Dependencies

```bash
# Install/update all dependencies
npm install

# Fix any version mismatches
npx expo install --fix
```

### ✅ Step 3: Test Prebuild Locally (CRITICAL)

```bash
# This MUST succeed before building with EAS
npx expo prebuild --clean --platform android
```

**Check for:**
- ✅ "Successfully generated native project"
- ✅ No plugin errors
- ✅ `android/gradlew` file exists

**If prebuild fails:**
- Read the error message
- Fix the specific issue
- Retry prebuild
- **DO NOT** build with EAS until prebuild succeeds

### ✅ Step 4: Verify Files Exist

```bash
# Check gradlew was created
ls -la android/gradlew

# Should show: -rwxr-xr-x ... android/gradlew
```

### ✅ Step 5: Build with EAS

Only after prebuild succeeds:

```bash
npx eas-cli build --profile development --platform android
```

## What Changed

### eas.json
- ✅ Removed `gradleCommand` (let EAS use defaults)
- ✅ Simplified build configuration
- ✅ Added `appVersionSource: "remote"`

### Why This Works

1. **Prebuild locally first** - Catches errors before EAS
2. **Clean eas.json** - Removes potential conflicts
3. **Simplified config** - Fewer points of failure
4. **Test incrementally** - Isolates problems

## Common Errors & Fixes

### Error: "Cannot find module 'expo/config-plugins'"

**Fix:**
```bash
npx expo install --fix
```

### Error: Plugin syntax error

**Fix:** Check `android-manifest.plugin.js`:
- Uses `expo/config-plugins` (not `@expo/config-plugins`)
- Exports a function
- Returns the config

### Error: Prebuild fails silently

**Fix:**
```bash
# Run with verbose output
npx expo prebuild --clean --platform android --verbose
```

## One-Liner Test

```bash
rm -rf android ios .expo && npm install && npx expo prebuild --clean --platform android && ls android/gradlew && echo "✅ Ready for EAS build!"
```

If this succeeds, you're ready to build with EAS.
