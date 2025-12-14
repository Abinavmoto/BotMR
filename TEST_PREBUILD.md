# Test Prebuild Before EAS Build

## Why This Matters

The `gradlew` error occurs when EAS Build tries to build but the Android project hasn't been generated. Testing prebuild locally helps catch config plugin errors before building with EAS.

## Test Steps

### 1. Clean Any Existing Native Folders

```bash
# Remove native folders (they'll be regenerated)
rm -rf android ios
```

### 2. Run Prebuild

```bash
npx expo prebuild --clean --platform android
```

### 3. Check for Errors

Look for:
- ✅ "Successfully generated native project"
- ❌ Any plugin errors
- ❌ Any missing dependencies

### 4. Verify Android Project Exists

```bash
# Check if gradlew was created
ls android/gradlew

# Should show: android/gradlew (file exists)
```

### 5. If Prebuild Succeeds

You can now build with EAS:

```bash
npx eas-cli build --profile development --platform android
```

### 6. If Prebuild Fails

Fix the errors shown, then retry prebuild.

## Common Prebuild Errors

### Error: "Cannot find module 'expo/config-plugins'"

**Fix:** Ensure you're using Expo SDK 54:
```bash
npx expo install --fix
```

### Error: Plugin syntax error

**Fix:** Check `android-manifest.plugin.js` for syntax errors. The plugin should:
- Export a function
- Return the modified config
- Use `expo/config-plugins` (not `@expo/config-plugins`)

### Error: Plugin not found

**Fix:** Verify plugin path in `app.json`:
```json
{
  "expo": {
    "plugins": [
      "./android-manifest.plugin.js"
    ]
  }
}
```

## Quick Test Command

```bash
# One-liner to test prebuild
rm -rf android ios && npx expo prebuild --clean --platform android && ls android/gradlew && echo "✅ Prebuild successful!"
```

If this succeeds, EAS Build should work too.
