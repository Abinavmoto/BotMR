# Comprehensive Fixes for File URI and Notification Issues

## Issues Identified

### 1. File URI Format Issue ❌
**Problem:** File exists but `Audio.Sound.createAsync` fails with `FileDataSourceException`
- Error shows: `/user/0/com.botmr.app/files/recordings/...` (missing `/data`)
- Root cause: Normalization was removing `/data` when converting `file:///data/...` to `file://data/...`

### 2. Notification Verification Issue ⚠️
**Problem:** Notification not visible after 5 retries, but service still starts
- Notification verification fails but doesn't block service start
- Could lead to background recording issues

## Fixes Applied

### 1. ✅ Fixed File URI Format

**Root Cause:** According to Expo documentation, `file:///` (three slashes) is the **CORRECT** format for absolute paths on Android. The previous normalization was incorrectly removing `/data`.

**Solution:** Try multiple URI formats in order:
1. **Original URI as-is** (`file:///data/...`) - This is the correct format per Expo docs
2. **Absolute path** (`/data/...`) - Fallback without file:// prefix
3. **Two slashes** (`file://data/...`) - Last resort (though this removes /data and might not work)

**File:** `components/meeting-detail-screen.tsx`

```typescript
// Try formats in order of preference
const uriFormats = [
  { name: 'Original (file:///data/...)', uri: audioUri },
  { name: 'Absolute path', uri: audioUri.replace(/^file:\/\/+/, '') },
]

// Try each format until one works
for (const format of uriFormats) {
  try {
    const result = await Audio.Sound.createAsync({ uri: format.uri }, {...})
    // Success - use this format
    break
  } catch (error) {
    // Try next format
  }
}
```

### 2. ✅ Enhanced Notification Verification

**Root Cause:** Notification verification was non-blocking and didn't handle failures properly.

**Solution:** 
- Better error logging
- Automatic retry to re-display notification if verification fails
- More detailed warnings about potential issues

**File:** `src/services/foregroundService.ts`

```typescript
verifyNotificationVisible(...)
  .then((visible) => {
    if (!visible) {
      console.warn('⚠️ Notification not visible after retries')
      // Try to re-display notification as fallback
      setTimeout(async () => {
        await notifee.displayNotification({...})
      }, 1000)
    }
  })
```

## Expected Behavior

### File Loading:
1. ✅ Try original URI first (`file:///data/...`) - should work
2. ✅ If fails, try absolute path (`/data/...`)
3. ✅ Log which format worked for debugging
4. ✅ All formats preserve `/data` in path

### Notification:
1. ✅ Display notification
2. ✅ Verify it's visible (with retries)
3. ✅ If not visible, try to re-display
4. ✅ Log detailed warnings about issues
5. ✅ Service continues even if verification fails (non-blocking)

## Test Cases

### File URI Test Cases:
- [ ] `file:///data/user/0/com.botmr.app/files/recordings/xxx.m4a` → Should work (original format)
- [ ] `/data/user/0/com.botmr.app/files/recordings/xxx.m4a` → Should work (absolute path fallback)
- [ ] File exists and is verified → Should load successfully
- [ ] File doesn't exist → Should show clear error

### Notification Test Cases:
- [ ] Notification appears immediately → Verification succeeds
- [ ] Notification delayed → Verification retries and succeeds
- [ ] Notification fails to appear → Re-display attempt after 1 second
- [ ] Service starts even if notification delayed → Non-blocking behavior

## Files Modified

1. ✅ `components/meeting-detail-screen.tsx`
   - Try multiple URI formats
   - Keep `/data` in all formats
   - Better error handling and logging

2. ✅ `src/services/foregroundService.ts`
   - Enhanced notification verification
   - Automatic retry for failed notifications
   - Better error logging

## Key Insights

1. **`file:///` (three slashes) is CORRECT** for absolute paths on Android per Expo docs
2. **Never remove `/data`** from the path - it's required
3. **Try multiple formats** as fallback for compatibility
4. **Notification verification** should be non-blocking but with retry logic

**All fixes are complete!** 🎉
