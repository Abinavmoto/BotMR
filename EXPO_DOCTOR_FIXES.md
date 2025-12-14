# Expo Doctor Fixes Applied

## Issues Fixed

### 1. ✅ Added `.expo/` to `.gitignore`
- Added `.expo/` directory to ignore list
- Also added `/android` and `/ios` for prebuild workflow

### 2. ✅ Removed Duplicate Lock File
- Deleted `pnpm-lock.yaml`
- Keeping `package-lock.json` (using npm)

### 3. ✅ Fixed Config Plugins Import
- Changed `@expo/config-plugins` import to `expo/config-plugins` in `android-manifest.plugin.js`
- Removed `@expo/config-plugins` from dependencies (it's now part of `expo` package)
- Config plugins are now accessed via `expo/config-plugins` sub-export

### 4. ✅ Added Missing Peer Dependency
- Added `expo-font` to dependencies (required by `@expo/vector-icons`)

### 5. ✅ Updated Package Versions
- Updated `expo-audio`: `~1.0.0` → `~1.1.0`
- Updated `expo-notifications`: `~0.29.0` → `~0.32.15`
- Moved `expo` to devDependencies (for config plugins access)

## Next Steps

Run these commands to apply the fixes:

```bash
# Install updated dependencies
npm install

# Verify with expo doctor
npx expo doctor

# If there are still duplicate dependencies, run:
npm dedupe

# Then rebuild
npx expo prebuild --clean
```

## Notes

### About Native Folders
The warning about native folders (`/android`, `/ios`) is expected if you're using prebuild. These folders are generated during `expo prebuild` and are now in `.gitignore`. If you want to keep them in git (for custom native code), remove them from `.gitignore`.

### About Config Plugins
- `expo/config-plugins` is the correct import (sub-export of expo package)
- No need to install `@expo/config-plugins` separately
- Config plugins are accessed via the `expo` package

### About Duplicate Dependencies
If `expo doctor` still shows duplicate `expo-constants`, run:
```bash
npm dedupe
```

This will resolve the duplicate dependency issue.

## Files Modified

1. ✅ `.gitignore` - Added `.expo/`, `/android`, `/ios`
2. ✅ `package.json` - Updated versions, added `expo-font`, removed `@expo/config-plugins`
3. ✅ `android-manifest.plugin.js` - Changed import to `expo/config-plugins`
4. ✅ Deleted `pnpm-lock.yaml`

## Verification

After running `npm install`, verify with:
```bash
npx expo doctor
```

All checks should now pass (or show only warnings about native folders if you're using prebuild).
