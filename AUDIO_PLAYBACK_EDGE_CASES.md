# Audio Playback Edge Cases - Background Handling

## Problem

Error when trying to play/pause audio while app is in background:
```
ERROR  Error playing/pausing audio: [Error: expo.modules.av.AudioFocusNotAcquiredException: This experience is currently in the background, so audio focus could not be acquired.]
```

## Root Cause

Android requires audio focus to be acquired before playing audio. When the app is in the background, Android denies audio focus acquisition to prevent apps from playing audio without user awareness.

## Solution

### 1. App State Tracking

**File:** `components/meeting-detail-screen.tsx`

Added `AppState` tracking to monitor when the app goes to background:

```typescript
const appStateRef = useRef<AppStateStatus>(AppState.currentState)

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    appStateRef.current = nextAppState
    
    // If app goes to background while playing, pause playback
    if (nextAppState.match(/inactive|background/) && isPlaying && sound) {
      sound.pauseAsync().catch((error) => {
        console.warn('Error pausing audio when app backgrounded:', error)
      })
    }
  })
  
  return () => {
    subscription.remove()
  }
}, [isPlaying, sound])
```

### 2. Pre-Playback Checks

Before attempting to play audio, check if app is active:

```typescript
const playPause = async () => {
  // Check if app is in background - audio playback requires app to be active
  const currentAppState = appStateRef.current
  if (currentAppState.match(/inactive|background/)) {
    Alert.alert(
      'App in Background',
      'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
      [{ text: 'OK' }]
    )
    return
  }
  
  // ... rest of playback logic
}
```

### 3. Error Handling

Added specific error handling for background audio errors:

```typescript
const handlePlaybackError = (error: any) => {
  const errorMessage = error?.message || 'Unknown error'
  
  // Check for specific error types
  if (errorMessage.includes('AudioFocusNotAcquiredException') || 
      errorMessage.includes('background')) {
    Alert.alert(
      'App in Background',
      'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
      [{ text: 'OK' }]
    )
  } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
    Alert.alert(
      'Permission Error',
      'Audio playback permission is required. Please check your app permissions in Settings.',
      [{ text: 'OK' }]
    )
  } else {
    Alert.alert(
      'Playback Error',
      'Failed to play audio. Please try again. If the problem persists, restart the app.',
      [{ text: 'OK' }]
    )
  }
}
```

### 4. Multiple Safety Checks

Added multiple checks throughout the playback flow:

1. **Before playPause() starts** - Check app state
2. **After loading sound** - Check app state before playing
3. **Before playAsync()** - Final check before actual playback
4. **In error handler** - Specific handling for background errors

## Behavior

### When App is Active:
- ✅ Audio playback works normally
- ✅ Play/pause buttons function correctly
- ✅ No errors

### When App Goes to Background:
- ✅ Audio automatically pauses (if playing)
- ✅ User cannot start playback from background
- ✅ Clear error message if user tries to play

### When User Tries to Play from Background:
- ✅ Prevents playback attempt
- ✅ Shows user-friendly alert explaining why
- ✅ No error logs (handled gracefully)

## Testing

1. **Start playback while app is active:**
   - ✅ Should play normally

2. **Background app while playing:**
   - ✅ Audio should pause automatically
   - ✅ No errors in logs

3. **Try to play while app is backgrounded:**
   - ✅ Should show alert, not attempt playback
   - ✅ No error logs

4. **Return to foreground:**
   - ✅ Playback should work normally again

## Files Modified

1. ✅ `components/meeting-detail-screen.tsx`
   - Added `AppState` tracking
   - Added pre-playback checks
   - Added error handling for background errors
   - Auto-pause when app backgrounds

The audio playback now handles all edge cases gracefully without throwing errors.




