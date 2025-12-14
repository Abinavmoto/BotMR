# Notification Visibility Fix

## Problem

Notifications are not appearing when the screen is locked, even though the foreground service is being started.

## Root Cause

1. **Missing Notifee Permission Request**: Notifee requires explicit permission requests on Android 13+ before displaying notifications
2. **No Verification**: We weren't verifying that the notification actually appeared in the system
3. **Timing Issues**: Notification might not be fully displayed before we verify it

## Solution

### 1. Added Notifee Permission Request

**File:** `src/services/foregroundService.ts`

Added `requestNotifeePermissions()` function that:
- Checks current notification permission status
- Requests permissions if not granted (Android 13+)
- Returns `true` if permissions are granted, `false` otherwise

```typescript
export async function requestNotifeePermissions(): Promise<boolean> {
  // Check current status
  const settings = await notifee.getNotificationSettings()
  
  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    return true
  }
  
  // Request permissions
  const requestSettings = await notifee.requestPermission()
  return requestSettings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
}
```

### 2. Request Permissions Before Displaying Notification

**File:** `src/services/foregroundService.ts` - `startForegroundService()`

Now requests permissions **BEFORE** displaying the notification:

```typescript
// 1. Request permissions FIRST
const hasPermission = await requestNotifeePermissions()
if (!hasPermission) {
  Alert.alert('Notification Permission Required', ...)
  return false
}

// 2. Verify handler is registered
// 3. Create channel
// 4. Display notification
```

### 3. Enhanced Verification

Added comprehensive verification after displaying notification:
- Waits 500ms for notification to appear
- Checks if notification exists in `getDisplayedNotifications()`
- Logs detailed error information if notification is missing
- Returns `false` if notification is not visible (so recording can be stopped)

### 4. Better Error Messages

If notification is not visible, logs include:
- Current notification settings
- Permission status
- Suggestions for fixing the issue

## Expected Behavior

### On Recording Start:

1. **Permission Check:**
   ```
   📱 [ForegroundService] Requesting notification permissions...
   ✅ [ForegroundService] Notification permissions granted
   ```

2. **Notification Display:**
   ```
   📤 [ForegroundService] Calling notifee.displayNotification()...
   ✅ [ForegroundService] Notification confirmed visible in system
   ✅ [ForegroundService] Notification ID: recording-status
   ```

3. **When Screen Locks:**
   - Notification should remain visible in notification tray
   - Notification should show "🎙️ BotMR is recording audio"
   - Notification should update with duration

## Testing

1. **Grant Permissions:**
   - Start recording
   - If permission dialog appears, grant notification permission
   - Verify notification appears immediately

2. **Lock Screen:**
   - Start recording
   - Lock screen
   - Pull down notification tray
   - Verify notification is visible

3. **Check Logs:**
   - Look for "Notification confirmed visible in system"
   - If you see "Notification NOT visible", check:
     - Notification permissions in Settings
     - Battery optimization settings
     - Notification channel settings

## If Notification Still Doesn't Appear

1. **Check Notification Permissions:**
   - Settings → Apps → BotMR → Notifications
   - Ensure "Allow notifications" is ON

2. **Check Battery Optimization:**
   - Settings → Apps → BotMR → Battery
   - Set to "Not optimized" or "Unrestricted"

3. **Check Notification Channel:**
   - Settings → Apps → BotMR → Notifications → Recording Status
   - Ensure channel is enabled and importance is HIGH

4. **Check Logs:**
   - Look for permission denial messages
   - Check if handler registration logs appear in index.js

## Files Modified

1. ✅ `src/services/foregroundService.ts`
   - Added `requestNotifeePermissions()` function
   - Added permission check in `startForegroundService()`
   - Enhanced notification verification
   - Better error logging

The notification should now appear reliably when recording starts and remain visible when the screen is locked.
