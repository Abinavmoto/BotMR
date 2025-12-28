# Audio Playback False Positive Fix

## Problem

User sees "App in Background" error dialog when trying to play audio, even though the app is in the foreground. After clicking OK and trying again, playback works. This indicates a false positive in app state detection.

## Root Cause

1. **Stale AppState Ref**: The `appStateRef.current` might be stale when user navigates to the meeting detail screen
2. **Incorrect State Check**: Checking for `!== 'active'` blocks playback even when app is `'inactive'` (which is OK for foreground playback)
3. **Timing Issue**: App state might be `'inactive'` during navigation transitions, which is normal

## Solution

### 1. Always Check Current State

**File:** `components/meeting-detail-screen.tsx`

Changed from checking cached ref to always checking `AppState.currentState`:

```typescript
// BEFORE (incorrect):
const currentAppState = appStateRef.current
if (currentAppState.match(/inactive|background/)) {
  // Blocks even when app is active but ref is stale
}

// AFTER (correct):
const currentAppState = AppState.currentState
if (currentAppState === 'background') {
  // Only blocks when definitely backgrounded
}
```

### 2. Only Block When Backgrounded

Changed logic to only block when state is `'background'`, not `'inactive'`:

- **`'active'`**: App is in foreground → ✅ Allow playback
- **`'inactive'`**: App is transitioning (e.g., during navigation) → ✅ Allow playback
- **`'background'`**: App is backgrounded → ❌ Block playback

### 3. Update Ref on Component Mount

Added ref update when component mounts to ensure it's current:

```typescript
useEffect(() => {
  loadMeeting()
  
  // CRITICAL: Update app state ref when component mounts
  appStateRef.current = AppState.currentState
  
  return () => { /* cleanup */ }
}, [meetingId])
```

### 4. Retry Logic for Inactive State

If state is `'inactive'`, wait 200ms and check again (might be transitioning):

```typescript
if (currentState === 'inactive') {
  await new Promise(resolve => setTimeout(resolve, 200))
  const recheckState = AppState.currentState
  if (recheckState === 'background') {
    // Now definitely backgrounded, block
    return
  }
  // If now active, proceed
}
```

## Behavior

### Before Fix:
- ❌ Shows error dialog even when app is in foreground
- ❌ User has to click OK and try again
- ❌ Blocks playback on `'inactive'` state (false positive)

### After Fix:
- ✅ Only blocks when app is definitely `'background'`
- ✅ Allows playback when app is `'active'` or `'inactive'`
- ✅ Updates app state ref on component mount
- ✅ Retries if state is `'inactive'` (might be transitioning)

## App State Values

- **`'active'`**: App is running in foreground
- **`'inactive'`**: App is transitioning (e.g., during navigation, modal opening)
- **`'background'`**: App is running in background

**Key Insight**: `'inactive'` is normal during navigation and should NOT block playback.

## Files Modified

1. ✅ `components/meeting-detail-screen.tsx`
   - Changed to always check `AppState.currentState` (not cached ref)
   - Only block when state is `'background'` (not `'inactive'`)
   - Added ref update on component mount
   - Added retry logic for `'inactive'` state

The false positive error should now be resolved, and playback should work on the first attempt when the app is in the foreground.
