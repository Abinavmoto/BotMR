# Fix: "no registered foreground service has been set"

## Problem

The warning `[notifee] no registered foreground service has been set for displaying a foreground notification` appears because Notifee requires a foreground service handler to be registered before using `asForegroundService: true`.

## Solution

### 1. Register Foreground Service Handler

Notifee requires calling `registerForegroundService()` before displaying a notification with `asForegroundService: true`.

**Added to `src/services/foregroundService.ts`:**
```typescript
export function registerForegroundServiceHandler(): void {
  notifee.registerForegroundService((notification) => {
    return new Promise(() => {
      // Promise never resolves, keeping service alive
      // Service stops when stopForegroundService() is called
    })
  })
}
```

### 2. Call Registration on App Start

**Updated `components/recording-screen.tsx`:**
- Calls `registerForegroundServiceHandler()` in `useEffect` when component mounts
- Ensures handler is registered before any recording starts

### 3. Updated Config Plugin

**Updated `android-manifest.plugin.js`:**
- Changed service name from `.ForegroundAudioService` to `app.notifee.core.ForegroundService`
- Uses Notifee's built-in service class instead of a custom one

### 4. Note on Notifee Plugin

**Important:** `@notifee/react-native` does NOT need to be in the plugins array. It's a regular React Native library that works with Expo without a config plugin. Only our custom `android-manifest.plugin.js` is needed in the plugins array.

## How It Works

1. **On App Start:**
   - `registerForegroundServiceHandler()` is called
   - Notifee registers the handler that will keep the service alive

2. **On Recording Start:**
   - Handler is verified (registered if needed)
   - Channel is created
   - Notification is displayed with `asForegroundService: true`
   - Notifee binds to the registered handler

3. **During Recording:**
   - Service stays alive because the promise never resolves
   - Notification is updated periodically

4. **On Recording Stop:**
   - `stopForegroundService()` is called
   - Service is stopped and notification is canceled

## Testing

After rebuilding:

1. Start recording
2. Check logs - should see:
   - `✅ Foreground service handler registered`
   - `✅ Foreground service started successfully`
   - **NO** `[notifee] no registered foreground service` warning

3. Lock screen and verify recording continues

## Rebuild Required

```bash
npx expo prebuild --clean
npx eas-cli build --profile development --platform android
```

Or for local build:
```bash
npx expo run:android
```

## Key Changes

1. ✅ Added `registerForegroundServiceHandler()` function
2. ✅ Call handler registration on component mount
3. ✅ Updated config plugin to use Notifee's service class
4. ✅ Added `@notifee/react-native` to plugins in app.json
5. ✅ Handler is automatically registered before starting service

This should eliminate the warning and ensure the foreground service works properly.
