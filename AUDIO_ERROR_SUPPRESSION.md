# Audio Error Suppression - Background Playback

## Problem

Even with app state checks, `AudioFocusNotAcquiredException` errors are still appearing in logs when the app is backgrounded. This happens because:

1. Race conditions between app state checks and `playAsync()` calls
2. The error is thrown even when we check app state
3. Multiple code paths might trigger playback

## Solution

### 1. Suppress Expected Errors

**File:** `components/meeting-detail-screen.tsx`

Added error suppression for `AudioFocusNotAcquiredException` when it's expected (app is backgrounded):

```typescript
catch (error: any) {
  // Suppress AudioFocusNotAcquiredException - it's expected when backgrounded
  const errorMessage = error?.message || ''
  if (errorMessage.includes('AudioFocusNotAcquiredException') || 
      errorMessage.includes('background')) {
    console.warn('Audio focus not available (app may be backgrounded) - ignoring error')
    return // Don't show alert or log as error
  }
  // Handle other errors normally
  handlePlaybackError(error)
}
```

### 2. Multiple State Checks

Added multiple checks throughout the playback flow:

1. **Before setTimeout**: Check `appStateRef.current`
2. **In setTimeout**: Check `AppState.currentState === 'active'`
3. **Before playAsync**: Final check `AppState.currentState === 'active'`

### 3. Early Returns

Added early returns to prevent execution if app is not active:

```typescript
if (currentState !== 'active') {
  console.warn('App is not active, cannot play audio. State:', currentState)
  return // Don't attempt playback
}
```

### 4. Silent Error Handling

When pausing due to backgrounding, suppress expected errors:

```typescript
sound.pauseAsync().catch((error: any) => {
  // Suppress errors when pausing due to backgrounding
  const errorMessage = error?.message || ''
  if (!errorMessage.includes('AudioFocusNotAcquiredException')) {
    console.warn('Error pausing audio when app backgrounded:', error)
  }
})
```

## Behavior

### When App is Active:
- ✅ Audio playback works normally
- ✅ No errors

### When App is Backgrounded:
- ✅ Playback attempts are prevented
- ✅ Errors are suppressed (not shown to user)
- ✅ Warnings are logged (for debugging)
- ✅ No error alerts shown

### Error Logs:
- **Before**: `ERROR Error playing/pausing audio: [AudioFocusNotAcquiredException...]`
- **After**: `WARN Audio focus not available (app may be backgrounded) - ignoring error`

## Benefits

1. **Cleaner Logs**: No ERROR messages for expected behavior
2. **Better UX**: No error alerts when user backgrounds app
3. **Proper Handling**: Errors are still caught and handled gracefully
4. **Debugging**: Warnings still logged for debugging purposes

## Files Modified

1. ✅ `components/meeting-detail-screen.tsx`
   - Added error suppression for `AudioFocusNotAcquiredException`
   - Added multiple app state checks
   - Added early returns
   - Improved error handling in pause callback

The errors will now be suppressed when they're expected (app backgrounded), while still logging warnings for debugging.




