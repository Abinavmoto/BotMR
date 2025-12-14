# Android Lock Screen Recording Test Checklist

## Prerequisites

1. ✅ Development build installed (not Expo Go)
2. ✅ Microphone permission: "Allow all the time" (not "Only while using app")
3. ✅ Notification permissions granted
4. ✅ App running on Android device (not emulator for best results)

## Test Steps

### Step 1: Start Recording

1. Open the app
2. Tap "Record Meeting" button
3. **IMMEDIATELY check notification panel:**
   - ✅ Notification should appear: "🎙️ BotMR is recording audio — Tap to return — 0:00"
   - ✅ Notification should be persistent (cannot be swiped away)
   - ✅ Notification should show in lock screen

**Expected Logs:**
```
🚀 [App.tsx] Registering foreground service handler on app startup...
✅ [ForegroundService] Handler registered successfully in app entry point
📱 [Recording] Starting foreground service notification BEFORE recording creation...
✅ [ForegroundService] Handler already registered
📱 [ForegroundService] Creating/verifying notification channel...
✅ [ForegroundService] Notification channel created/verified
📱 [ForegroundService] Displaying foreground service notification...
✅ [ForegroundService] Notification confirmed visible in system
✅ [ForegroundService] Foreground service started successfully
✅ [Recording] Foreground service notification started successfully
```

### Step 2: Verify Notification is Visible

1. Pull down notification panel
2. **Verify:**
   - ✅ Notification is visible
   - ✅ Shows "🎙️ BotMR is recording audio"
   - ✅ Shows current time (e.g., "0:05")
   - ✅ Cannot be dismissed (no swipe away)

### Step 3: Lock Screen Test

1. **While recording is active:**
   - Press power button to lock screen
   - **Verify:** Notification is still visible on lock screen

2. **Speak for 10 seconds:**
   - Say: "Testing one two three four five six seven eight nine ten"
   - Count slowly and clearly
   - **Verify:** Recording continues (notification updates)

3. **Check logs (if accessible):**
   - Should see: "App backgrounded - recording continues with foreground service"
   - Should see: "✅ [ForegroundService] Update foreground service notification"
   - Should NOT see: "[notifee] no registered foreground service" warning

### Step 4: Unlock and Stop

1. Unlock the screen
2. Return to app
3. Stop recording
4. **Verify:** Notification disappears

**Expected Logs:**
```
🛑 [ForegroundService] Stopping foreground service...
✅ [ForegroundService] stopForegroundService() called
✅ [ForegroundService] Notification canceled
✅ [ForegroundService] Foreground service stopped successfully
```

### Step 5: Playback Test

1. Go to meeting detail screen
2. Play the recording
3. **CRITICAL VERIFICATION:**
   - ✅ Audio from BEFORE lock screen is audible
   - ✅ Audio from DURING lock screen (your 10-second test) is audible
   - ✅ Audio from AFTER unlock is audible
   - ✅ Total duration matches expected time

## Success Criteria

### ✅ All Must Pass:

1. **Notification appears BEFORE recording starts**
   - Notification visible immediately when recording button is tapped
   - No delay or missing notification

2. **Notification persists on lock screen**
   - Visible when screen is locked
   - Updates with current duration
   - Cannot be dismissed

3. **No warnings in logs**
   - No `[notifee] no registered foreground service` warnings
   - Handler registered in App.tsx logs
   - Service started before recording creation

4. **Audio captured during lock screen**
   - Playback includes audio from locked period
   - No silent gaps
   - Duration matches actual recording time

5. **Service stops cleanly**
   - Notification disappears when recording stops
   - No lingering notifications
   - Clean shutdown logs

## Failure Scenarios

### ❌ Notification doesn't appear

**Symptoms:**
- No notification when recording starts
- Warning: `[notifee] no registered foreground service`

**Fix:**
- Verify handler is registered in `App.tsx` (check logs on app startup)
- Ensure notification is started BEFORE `Audio.Recording.createAsync()`
- Check notification permissions

### ❌ Notification appears but recording is silent

**Symptoms:**
- Notification visible
- Recording duration increases
- Playback has no audio from locked period

**Fix:**
- Verify microphone permission is "Allow all the time" (not "Only while using app")
- Check Android Settings → Apps → BotMR → Permissions → Microphone

### ❌ Recording stops when screen locks

**Symptoms:**
- Notification visible
- Recording stops when screen locks
- Duration doesn't match actual time

**Fix:**
- Verify foreground service notification is started BEFORE recording
- Check logs for service restart attempts
- Ensure `asForegroundService: true` is set

## Debug Commands

### Check Notification Status

```bash
# In React Native debugger or logs
# Look for these log patterns:

# On app startup:
🚀 [App.tsx] Registering foreground service handler...
✅ [ForegroundService] Handler registered successfully

# When recording starts:
📱 [Recording] Starting foreground service notification BEFORE recording creation...
✅ [ForegroundService] Notification confirmed visible in system

# When backgrounded:
App backgrounded - recording continues with foreground service
```

### Verify Handler Registration

Check logs for:
```
✅ [ForegroundService] Handler registered successfully in app entry point
```

If missing, handler wasn't registered in App.tsx.

## Quick Test Script

```bash
# 1. Start app
# 2. Check logs for handler registration
# 3. Start recording
# 4. Verify notification appears
# 5. Lock screen
# 6. Speak for 10 seconds
# 7. Unlock
# 8. Stop recording
# 9. Playback and verify audio from locked period
```

## Expected Behavior

- **Notification:** Always visible when recording
- **Lock Screen:** Recording continues, notification visible
- **Audio:** Captured during all phases (foreground, background, locked)
- **Logs:** No warnings, clear debug messages
- **Playback:** Complete audio including locked period

## Troubleshooting

If any step fails:

1. Check logs for specific error messages
2. Verify handler registration in App.tsx
3. Confirm notification started BEFORE recording
4. Check microphone permission level
5. Verify notification permissions
6. Test on different Android device/version
