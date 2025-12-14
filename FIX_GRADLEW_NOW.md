# Fix gradlew Error - Step by Step

## ✅ Fixed: expo-system-ui Version

Changed from `~4.0.4` to `~6.0.9` (correct for SDK 54)

## 🔍 The Real Problem

The `gradlew` file is missing because **prebuild is failing**. EAS Build runs prebuild automatically, but if it fails, you only see "gradlew missing" - not the actual error.

## 🚨 CRITICAL: Test Prebuild Locally First

You **MUST** test prebuild locally to see the actual error:

```bash
# 1. Clean everything
rm -rf android ios .expo

# 2. Install correct dependencies
npm install

# 3. Fix all version mismatches
npx expo install --fix

# 4. Test prebuild (THIS WILL SHOW THE REAL ERROR)
npx expo prebuild --clean --platform android --verbose
```

## What to Look For

### ✅ Success Looks Like:
```
✔ Successfully generated native project
✔ Created android/gradlew
```

### ❌ Failure Looks Like:
```
✖ Error in plugin: android-manifest.plugin.js
✖ Cannot find module 'expo/config-plugins'
✖ Plugin syntax error
```

## Common Prebuild Failures

### Failure 1: Config Plugin Error

**Error:** Plugin fails to load or execute

**Fix:**
1. Check `android-manifest.plugin.js` syntax
2. Verify it uses `expo/config-plugins` (not `@expo/config-plugins`)
3. Ensure it exports a function

### Failure 2: Missing Dependencies

**Error:** "Cannot find module" or version mismatches

**Fix:**
```bash
npm install
npx expo install --fix
```

### Failure 3: Plugin Not Found

**Error:** Plugin file not found

**Fix:**
- Verify `./android-manifest.plugin.js` exists
- Check path in `app.json` is correct
- Ensure file is committed to git

## Quick Test Script

Run this to test everything:

```bash
# Clean
rm -rf android ios .expo

# Install
npm install

# Fix versions
npx expo install --fix

# Test prebuild
npx expo prebuild --clean --platform android

# Check result
if [ -f "android/gradlew" ]; then
  echo "✅ SUCCESS! gradlew exists. Ready for EAS build."
else
  echo "❌ FAILED! Check prebuild errors above."
  echo "❌ DO NOT build with EAS until this succeeds!"
fi
```

## If Prebuild Fails

1. **Read the error message** - It will tell you exactly what's wrong
2. **Fix that specific issue**
3. **Retry prebuild**
4. **Only build with EAS after prebuild succeeds locally**

## If Prebuild Succeeds

Then you can build with EAS:

```bash
npx eas-cli build --profile development --platform android
```

## Why This Approach Works

- **Local prebuild** shows the actual error (not just "gradlew missing")
- **Fixing locally** ensures EAS build will work
- **Testing first** saves time and build credits

## Next Steps

1. ✅ Run the test script above
2. ✅ Share the prebuild error if it fails
3. ✅ Fix the error
4. ✅ Retry prebuild
5. ✅ Build with EAS only after prebuild succeeds

The key is: **Don't build with EAS until prebuild works locally!**
