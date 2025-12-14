# Foreground Service Registration Fix

## Problem

The warning `[notifee] no registered foreground service has been set` appears because the foreground service handler was being registered in a component (`RecordingScreen`) instead of the app entry point.

## Solution

### 1. ✅ Moved Registration to App Entry Point

**File:** `App.tsx`

The foreground service handler is now registered in `App.tsx` on app startup:

```typescript
useEffect(() => {
  // CRITICAL: Register foreground service handler on app startup (Android only)
  if (Platform.OS === 'android') {
    registerForegroundServiceHandler()
    createForegroundServiceChannel()
  }
}, [])
```

**Why this matters:**
- Notifee requires the handler to be registered before any notification with `asForegroundService: true`
- Registering in App.tsx ensures it's available globally before any component needs it
- Prevents the "no registered foreground service" warning

### 2. ✅ Notification Started BEFORE Recording

**File:** `components/recording-screen.tsx`

The foreground service notification is now started **BEFORE** `Audio.Recording.createAsync()`:

```typescript
// 1. Configure audio mode
await configureAudioModeForRecording()

// 2. Start foreground service notification (BEFORE recording)
if (Platform.OS === 'android') {
  await startForegroundService(0) // Notification appears here
}

// 3. THEN create recording
const result = await Audio.Recording.createAsync(...)
```

**Why this matters:**
- Notification must be visible when recording starts
- Android requires the foreground service to be active before allowing background recording
- Ensures the notification is persistent and visible

### 3. ✅ Enhanced Debug Logging

Added comprehensive debug logs:

**In App.tsx:**
- `🚀 [App.tsx] Registering foreground service handler on app startup...`
- `✅ [ForegroundService] Handler registered successfully in app entry point`

**In foregroundService.ts:**
- `📱 [ForegroundService] Creating/verifying notification channel...`
- `📱 [ForegroundService] Displaying foreground service notification...`
- `✅ [ForegroundService] Notification confirmed visible in system`
- `✅ [ForegroundService] Foreground service started successfully`

**In recording-screen.tsx:**
- `📱 [Recording] Starting foreground service notification BEFORE recording creation...`
- `✅ [Recording] Foreground service notification started successfully`

### 4. ✅ Fixed Deprecation Warning

Updated `notificationService.ts` to use new API:
- `shouldShowAlert` → `shouldShowBanner` and `shouldShowList`

## Key Changes

### App.tsx
- ✅ Added `registerForegroundServiceHandler()` call in `useEffect`
- ✅ Added `createForegroundServiceChannel()` call
- ✅ Runs on app startup, before any screens load

### recording-screen.tsx
- ✅ Removed handler registration (now in App.tsx)
- ✅ Moved `startForegroundService()` to BEFORE `Audio.Recording.createAsync()`
- ✅ Removed duplicate service start call
- ✅ Added debug logs

### foregroundService.ts
- ✅ Enhanced `registerForegroundServiceHandler()` with debug logs
- ✅ Enhanced `startForegroundService()` with verification
- ✅ Added notification visibility check
- ✅ Enhanced all functions with detailed logging

## Expected Behavior

### On App Startup:
```
🚀 [App.tsx] Registering foreground service handler on app startup...
✅ [ForegroundService] Handler registered successfully in app entry point
✅ [ForegroundService] Notification channel created/verified
```

### When Recording Starts:
```
📱 [Recording] Starting foreground service notification BEFORE recording creation...
✅ [ForegroundService] Handler already registered
📱 [ForegroundService] Creating/verifying notification channel...
✅ [ForegroundService] Notification channel created/verified
📱 [ForegroundService] Displaying foreground service notification...
✅ [ForegroundService] Notification confirmed visible in system
✅ [ForegroundService] Foreground service started successfully
✅ [Recording] Foreground service notification started successfully
Recording created successfully on attempt 1
```

### When Backgrounded:
- ✅ No `[notifee] no registered foreground service` warnings
- ✅ Notification updates continue
- ✅ Recording continues

## Testing

See `ANDROID_LOCK_SCREEN_TEST.md` for complete test checklist.

**Quick Test:**
1. Start app → Check logs for handler registration
2. Start recording → Verify notification appears immediately
3. Lock screen → Verify notification visible, recording continues
4. Speak for 10 seconds → Verify audio captured
5. Unlock → Stop recording
6. Playback → Verify audio from locked period is audible

## Files Modified

1. ✅ `App.tsx` - Added handler registration on startup
2. ✅ `components/recording-screen.tsx` - Moved notification start before recording
3. ✅ `src/services/foregroundService.ts` - Enhanced logging and verification
4. ✅ `src/services/notificationService.ts` - Fixed deprecation warning

## Result

- ✅ Handler registered in app entry point
- ✅ Notification started before recording
- ✅ No more "no registered foreground service" warnings
- ✅ Background recording works with locked screen
- ✅ Audio captured during all phases
