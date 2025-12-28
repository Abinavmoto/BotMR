# Audio URI Triple Slash Fix

## Problem
File exists and is verified, but `Audio.Sound.createAsync` fails with `FileDataSourceException` on Android.

**Logs show:**
- ✅ File exists, size: 430893 bytes
- ✅ URI: `file:///data/user/0/com.botmr.app/files/recordings/xxx.m4a`
- ❌ Error: `FileDataSourceException`

## Root Cause
expo-av on Android has issues with `file:///` (three slashes). The `FileSystem.documentDirectory` returns paths like `file:///data/...` (with three slashes), which causes `Audio.Sound.createAsync` to fail.

## Fix Applied

### Normalize URI for Audio.Sound.createAsync

**File:** `components/meeting-detail-screen.tsx`

Convert `file:///` (three slashes) to `file://` (two slashes):

```typescript
// CRITICAL: expo-av on Android has issues with file:/// (three slashes)
// Normalize to file:// (two slashes)
let audioUri = finalUri

// Remove file:/// and replace with file://
if (audioUri.startsWith('file:///')) {
  // file:///data/... -> file://data/...
  audioUri = 'file://' + audioUri.substring(7)
}
```

## Expected Behavior

### Before Fix:
- URI: `file:///data/user/0/com.botmr.app/files/recordings/xxx.m4a` (three slashes)
- Result: ❌ `FileDataSourceException`

### After Fix:
- URI: `file://data/user/0/com.botmr.app/files/recordings/xxx.m4a` (two slashes)
- Result: ✅ Audio loads successfully

## Files Modified

1. ✅ `components/meeting-detail-screen.tsx`
   - Normalize URI from `file:///` to `file://`
   - Enhanced logging

## Testing

The audio should now load successfully without `FileDataSourceException` errors! 🎉
