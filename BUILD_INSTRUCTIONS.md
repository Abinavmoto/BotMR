# Build Instructions - Notifee Foreground Service

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure you have:
   - `@notifee/react-native` installed
   - `@expo/config-plugins` installed
   - Custom `android-manifest.plugin.js` in project root

## Build Steps

### For Development Build (EAS)

```bash
# Clean and prebuild
npx expo prebuild --clean

# Build with EAS
npx eas-cli build --profile development --platform android
```

### For Local Build

```bash
# Clean and prebuild
npx expo prebuild --clean

# Run on Android
npx expo run:android
```

## Important Notes

### Notifee Plugin Configuration

**DO NOT** add `@notifee/react-native` to the plugins array in `app.json`. 

- Notifee is a regular React Native library
- It doesn't provide a config plugin
- It works with Expo without being in the plugins array
- Only our custom `android-manifest.plugin.js` should be in the plugins array

### What the Config Plugin Does

The `android-manifest.plugin.js` plugin:
- Adds `app.notifee.core.ForegroundService` to AndroidManifest.xml
- Adds required permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`)
- Sets `foregroundServiceType: 'microphone'`

### Verification

After building, check that:
1. Foreground service handler is registered (see logs)
2. No `[notifee] no registered foreground service` warnings
3. Recording continues when screen is locked

## Troubleshooting

### Error: "Unable to resolve a valid config plugin for @notifee/react-native"

**Solution:** Remove `@notifee/react-native` from the plugins array in `app.json`. It doesn't need to be there.

### Error: "no registered foreground service has been set"

**Solution:** Ensure `registerForegroundServiceHandler()` is called before starting recording. This happens automatically in the recording screen's `useEffect`.

### Service Not Starting

1. Check notification permissions are granted
2. Verify microphone permission is "Allow all the time"
3. Ensure `registerForegroundServiceHandler()` was called
4. Check logs for registration confirmation

## Files Modified

- ✅ `app.json` - Custom plugin only (NOT `@notifee/react-native`)
- ✅ `android-manifest.plugin.js` - Adds service to manifest
- ✅ `src/services/foregroundService.ts` - Service implementation
- ✅ `components/recording-screen.tsx` - Registers handler on mount
