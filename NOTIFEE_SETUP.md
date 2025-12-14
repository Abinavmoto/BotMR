# Notifee Setup for Android Background Recording

## Overview

This implementation uses `@notifee/react-native` to properly register a foreground service for Android background recording. This is the "missing piece" that makes background recording reliable on Android.

## Why Notifee?

`expo-notifications` doesn't properly register a foreground service on Android. `@notifee/react-native` provides the `asForegroundService: true` option which correctly registers the service with Android's system.

## Installation

```bash
npm install @notifee/react-native @expo/config-plugins
```

## Configuration

### 1. Config Plugin (`android-manifest.plugin.js`)

The config plugin automatically adds:
- Foreground service declaration in AndroidManifest.xml
- Required permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`)

### 2. App.json

The plugin is registered in `app.json`:
```json
{
  "expo": {
    "plugins": [
      "./android-manifest.plugin.js"
    ]
  }
}
```

### 3. Foreground Service Implementation

The service is implemented in `src/services/foregroundService.ts`:
- `startForegroundService()` - Starts the foreground service with notification
- `updateForegroundService()` - Updates notification with current duration
- `stopForegroundService()` - Stops the service and cancels notification
- `isForegroundServiceActive()` - Checks if service is running

## Key Features

### Foreground Service Configuration

```typescript
await notifee.displayNotification({
  android: {
    asForegroundService: true,  // CRITICAL: Makes it a foreground service
    ongoing: true,              // Non-dismissible
    foregroundServiceType: 'microphone',  // Required for Android 14+
  },
})
```

### Service Lifecycle

1. **On Recording Start:**
   - Channel is created (if not exists)
   - Foreground service is started
   - Notification is displayed
   - Service is tracked in state

2. **During Recording:**
   - Notification is updated every 5 seconds with duration
   - Service remains active even when app is backgrounded

3. **On Recording Stop:**
   - Foreground service is stopped
   - Notification is canceled
   - Service state is cleared

4. **On App Background:**
   - Service status is verified
   - If missing, attempts to restart
   - If restart fails, recording is stopped safely

## Testing

### Prerequisites
1. Development build (not Expo Go)
2. Microphone permission: "Allow all the time"
3. Notification permissions granted

### Test Steps
1. Start recording
2. Verify notification appears: "🎙️ BotMR is recording audio"
3. Lock screen
4. Wait 30+ seconds
5. Unlock and verify:
   - Recording continued
   - Duration is accurate
   - Audio quality is good

## Troubleshooting

### "Foreground service not active"
- Check notification permissions
- Verify config plugin is registered
- Rebuild app: `npx expo prebuild --clean`

### "Service stops when backgrounded"
- Verify microphone permission is "Allow all the time"
- Check battery optimization settings
- Ensure notification channel is created

### Build Errors
If you see `app.notifee:core not found`:
1. Install `expo-build-properties`:
   ```bash
   npm install expo-build-properties
   ```
2. Add to `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-build-properties",
           {
             "android": {
               "packagingOptions": {
                 "pickFirst": ["**/libc++_shared.so"]
               }
             }
           }
         ]
       ]
     }
   }
   ```
3. Run `npx expo prebuild --clean`

## Differences from expo-notifications

| Feature | expo-notifications | Notifee |
|---------|-------------------|---------|
| Foreground Service | ❌ Not properly registered | ✅ Properly registered |
| `asForegroundService` | ❌ Not available | ✅ Available |
| `foregroundServiceType` | ❌ Not available | ✅ Available (Android 14+) |
| Ongoing Notification | ⚠️ Limited support | ✅ Full support |

## References

- [Notifee Documentation](https://notifee.app/react-native/docs/overview)
- [Android Foreground Services](https://developer.android.com/develop/background-work/services/foreground-services)
- [Medium Article: The Missing Piece](https://drebakare.medium.com/enabling-background-recording-on-android-with-expo-the-missing-piece-41a24b108f6d)
