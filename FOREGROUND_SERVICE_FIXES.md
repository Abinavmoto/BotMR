# Foreground Service & Recording State Machine Fixes

## ✅ Completed Fixes

### 1. Removed Brittle Instant Notification Verification ✅
**File:** `src/services/foregroundService.ts`

**Changes:**
- Removed hard-fail instant verification after `displayNotification()`
- Added retry polling with backoff: `[300ms, 600ms, 1200ms, 2000ms, 3000ms]`
- Treats `displayNotification()` success as service started
- Only fails if all retries fail AND app is in foreground AND permissions are granted
- Verification is non-blocking and doesn't cause failures

**Before:**
```typescript
await notifee.displayNotification(...)
await new Promise(resolve => setTimeout(resolve, 500))
const displayedNotifications = await notifee.getDisplayedNotifications()
if (!notificationExists) {
  return false // Hard fail
}
```

**After:**
```typescript
await notifee.displayNotification(...)
// Treat success as started
isServiceActive = true
// Non-blocking retry verification
verifyNotificationVisible(...).then(...)
return true
```

---

### 2. Implemented Recording Session State Machine ✅
**File:** `src/hooks/useRecordingController.ts`

**States:**
- `IDLE`: Not recording
- `STARTING`: Starting recording (prevents duplicate starts)
- `RECORDING`: Currently recording
- `STOPPING`: Stopping recording (prevents duplicate stops)
- `FAILED`: Error occurred

**Features:**
- Disables start while `STARTING` or `STOPPING`
- Ensures stop/start are idempotent
- Cleanup always returns to `IDLE` or `FAILED`
- State transition logging
- Error handling with callbacks

**Usage:**
```typescript
const controller = useRecordingController({
  onStateChange: (state) => console.log('State:', state),
  onError: (error) => Alert.alert('Error', error.message)
})

// Actions
await controller.startRecording()
await controller.pauseRecording()
await controller.resumeRecording()
await controller.stopRecording()
await controller.resetRecordingEngine()
```

---

### 3. Fixed Duplicate Stop Calls ✅
**File:** `src/services/foregroundService.ts`

**Changes:**
- `stopForegroundService()` is now idempotent
- Short-circuits if already stopped (`isServiceActive` check)
- Clears notification update interval
- Marks as inactive first to prevent race conditions
- Safe to call multiple times

**Before:**
```typescript
export async function stopForegroundService(): Promise<void> {
  await notifee.stopForegroundService()
  await notifee.cancelNotification(NOTIFICATION_ID)
}
```

**After:**
```typescript
export async function stopForegroundService(): Promise<void> {
  if (!isServiceActive) {
    console.log('Service already stopped, skipping')
    return // Idempotent
  }
  
  isServiceActive = false // Mark inactive first
  if (notificationUpdateInterval) {
    clearInterval(notificationUpdateInterval)
  }
  await notifee.stopForegroundService()
  await notifee.cancelNotification(NOTIFICATION_ID)
}
```

---

### 4. Fixed Notification Timer "0:00" ✅
**File:** `src/services/foregroundService.ts`

**Changes:**
- `startForegroundService()` now accepts `recordingStartTimestamp` instead of `durationSeconds`
- Notification updates every 5 seconds using actual timestamp
- Timer shows accurate duration: `"Tap to return — mm:ss"`
- Interval cleared on stop and app termination

**Before:**
```typescript
export async function startForegroundService(durationSeconds: number)
// Shows "0:00" initially
```

**After:**
```typescript
export async function startForegroundService(recordingStartTimestamp: number)
// Calculates duration from timestamp
// Updates every 5 seconds automatically
```

**Implementation:**
- `startNotificationUpdateInterval()` function updates notification every 5 seconds
- Uses `recordingStartTimestamp` to calculate accurate duration
- Automatically cleared when service stops

---

### 5. Improved Error Handling ✅
**Files:** `src/services/foregroundService.ts`, `src/hooks/useRecordingController.ts`

**Changes:**
- Added `resetRecordingEngine()` function in hook
- Added `forceStopForegroundService()` for reset scenarios
- If foreground service truly fails, moves to `FAILED` state
- UI can show "Reset & Try Again" button
- Proper cleanup on all error paths

**Reset Function:**
```typescript
const resetRecordingEngine = async () => {
  // Stop recording
  // Cleanup intervals
  // Force stop foreground service
  // Reset audio mode
  // Clear all state
  // Return to IDLE
}
```

---

## Integration Status

### ✅ Completed
1. Foreground service with retry polling
2. Idempotent stop function
3. Notification timer with timestamp
4. Recording controller hook with state machine
5. Reset functionality

### 🔄 Partial Integration
- Recording screen partially uses hook
- Some old code still references `recordingRef`, `startTimeRef`
- Meeting save logic still uses old approach

### 📝 Next Steps (Optional)
1. Fully integrate hook into recording screen
2. Remove old state management code
3. Update meeting save to use controller state
4. Add UI for "Reset & Try Again" button

---

## Testing Checklist

### Foreground Service
- [ ] Start recording → Notification appears (may take up to 3 seconds)
- [ ] Notification timer updates every 5 seconds
- [ ] Stop recording → Notification disappears
- [ ] Multiple stop calls → No errors (idempotent)
- [ ] App backgrounded → Notification continues

### State Machine
- [ ] Start while starting → Prevented
- [ ] Stop while stopping → Prevented
- [ ] Start after stop → Works
- [ ] Reset from FAILED → Returns to IDLE
- [ ] State transitions logged

### Error Handling
- [ ] Foreground service fails → Moves to FAILED
- [ ] Reset button → Cleans up and returns to IDLE
- [ ] All cleanup paths → No leaks

---

## Files Modified

1. ✅ `src/services/foregroundService.ts`
   - Retry polling verification
   - Idempotent stop
   - Notification timer with timestamp
   - Force stop function

2. ✅ `src/hooks/useRecordingController.ts` (NEW)
   - State machine implementation
   - Recording lifecycle management
   - Reset functionality

3. 🔄 `components/recording-screen.tsx`
   - Partially integrated hook
   - Updated foreground service calls
   - Added reset function

---

## Key Improvements

1. **No More Brittle Failures**: Notification verification is retry-based, not instant
2. **State Safety**: State machine prevents invalid operations
3. **Idempotent Operations**: Safe to call stop/start multiple times
4. **Accurate Timer**: Notification shows real duration, not "0:00"
5. **Better Error Recovery**: Reset function for failed states

**All core fixes are complete!** 🎉
