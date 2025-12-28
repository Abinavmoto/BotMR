# Audio Playback Fix

## Problem
Cannot play saved audio files - getting `FileDataSourceException` errors.

## Root Causes

1. **File doesn't exist**: Recordings with 0 duration don't create actual files
2. **Missing file:// prefix**: Android requires `file://` prefix for local file URIs
3. **No file existence check**: Code tried to load files without checking if they exist
4. **Poor error handling**: Errors weren't shown to users clearly

## Fixes Applied

### 1. ✅ File Existence Check
**Before loading audio, check if file exists:**
```typescript
const fileInfo = await FileSystem.getInfoAsync(meeting.local_audio_uri)
if (!fileInfo.exists) {
  setAudioError('Audio file not found. The recording may not have been saved correctly.')
  return
}
```

### 2. ✅ URI Format Fix
**Ensure proper file:// prefix for Android:**
```typescript
let audioUri = meeting.local_audio_uri
if (!audioUri.startsWith('file://') && !audioUri.startsWith('http://') && !audioUri.startsWith('https://')) {
  audioUri = `file://${audioUri}`
}
```

### 3. ✅ Better Error Handling
**User-friendly error messages:**
- File not found → "Audio file not found. The recording may not have been saved correctly."
- Permission denied → "Permission denied. Please check app permissions."
- Other errors → Shows specific error message

### 4. ✅ Duration Check
**Don't try to load audio if duration is 0:**
```typescript
if (meeting && meeting.local_audio_uri && meeting.duration_sec > 0) {
  loadSound()
} else if (meeting && meeting.duration_sec === 0) {
  setAudioError('No audio recorded. This meeting has 0 seconds duration.')
}
```

### 5. ✅ Error UI
**Show error in UI with retry button:**
- Error icon
- Clear error message
- "Retry" button to try loading again

## Expected Behavior

### When File Exists:
- ✅ Audio loads successfully
- ✅ Play button works
- ✅ No errors shown

### When File Doesn't Exist:
- ❌ Shows error: "Audio file not found. The recording may not have been saved correctly."
- ✅ Shows "Retry" button
- ✅ User can try again

### When Duration is 0:
- ❌ Shows error: "No audio recorded. This meeting has 0 seconds duration."
- ✅ Prevents trying to load non-existent file

## Files Modified

1. ✅ `components/meeting-detail-screen.tsx`
   - Added file existence check
   - Fixed URI format
   - Added error state and UI
   - Added duration check
   - Better error messages

## Testing Checklist

- [ ] Open meeting with valid audio file → Should load and play
- [ ] Open meeting with missing file → Should show error with retry
- [ ] Open meeting with 0 duration → Should show "No audio recorded" error
- [ ] Click retry button → Should try to load again
- [ ] Play button disabled when error → Should not try to play

**All fixes are complete!** 🎉
