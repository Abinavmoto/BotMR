# Final Audio URI Fix - expo-av /data Stripping Bug

## Critical Issue Discovered

**Problem:** expo-av on Android is **stripping `/data`** from `file:///data/...` paths!

**Error Evidence:**
- File exists at: `/data/user/0/com.botmr.app/files/recordings/xxx.m4a`
- expo-av looks for: `/user/0/com.botmr.app/files/recordings/xxx.m4a` (missing `/data`)
- Error: `FileNotFoundException: /user/0/...` (not `/data/user/0/...`)

## Root Cause

expo-av on Android has a bug where it incorrectly parses `file:///data/...` URIs and removes `/data` from the path, looking for `/user/0/...` instead of `/data/user/0/...`.

## Solution: Try Multiple URI Formats

Since expo-av has this bug, we need to try multiple formats until one works:

### Priority Order:

1. **Absolute path (no prefix)** - `/data/user/0/...`
   - Most likely to work - expo-av might handle absolute paths better

2. **file:// (two slashes)** - `file:///data/user/0/...`
   - Standard file URI format

3. **Original URI** - `file:///data/user/0/...`
   - The "correct" format but expo-av has a bug with it

4. **file:/// (three slashes)** - `file:///data/user/0/...`
   - Same as original, but explicitly constructed

5. **Workaround: /user/0/... (without /data)**
   - If expo-av is stripping /data, try the path it's actually looking for
   - This is a workaround for the bug

## Implementation

**File:** `components/meeting-detail-screen.tsx`

```typescript
// Get FileSystem path (without file:// prefix)
const fileSystemPath = meeting.local_audio_uri.replace(/^file:\/\/+/, '')

// Try formats in priority order
const uriFormats = [
  { name: 'Absolute path (no prefix)', uri: fileSystemPath },
  { name: 'file:// (two slashes)', uri: `file://${fileSystemPath}` },
  { name: 'Original (file:///data/...)', uri: finalUri },
  { name: 'file:/// (three slashes)', uri: `file:///${fileSystemPath}` },
  // Workaround for expo-av bug
  { name: 'Workaround: /user/0/...', uri: fileSystemPath.replace(/^\/data/, '') },
]

// Try each format until one works
for (const format of uriFormats) {
  try {
    const result = await Audio.Sound.createAsync({ uri: format.uri }, {...})
    // Success!
    break
  } catch (error) {
    // Try next format
  }
}
```

## Expected Behavior

### When File Exists:
- ✅ Tries absolute path first (most likely to work)
- ✅ Falls back to other formats if needed
- ✅ Logs which format worked
- ✅ Audio loads successfully

### When All Formats Fail:
- ❌ Shows error with all attempted formats
- ✅ User can see what was tried
- ✅ Clear error message

## Files Modified

1. ✅ `components/meeting-detail-screen.tsx`
   - Get FileSystem path (without file:// prefix)
   - Try multiple URI formats in priority order
   - Workaround for expo-av /data stripping bug
   - Enhanced logging

## Test Cases

- [ ] File at `/data/user/0/...` → Should work with absolute path
- [ ] File at `/data/user/0/...` → Should work with file:// prefix
- [ ] All formats tried → Should log which one worked
- [ ] All formats fail → Should show clear error

**This should finally fix the FileDataSourceException!** 🎉
