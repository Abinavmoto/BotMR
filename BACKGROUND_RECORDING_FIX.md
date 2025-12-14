# Background Recording Fix - Screen Lock Issue

## Problem
Recording stops when the screen is locked, causing:
- Timer continues (showing 47 seconds)
- Actual recording stops (only 13 seconds recorded)
- Saved duration doesn't match actual audio file

## Root Cause
1. **iOS Background Limitations**: When the screen locks, iOS may suspend the recording session
2. **Expo Go Limitations**: Background recording is not fully supported in Expo Go
3. **Detection Delay**: Recording stops but we don't detect it immediately

## Fixes Applied

### 1. More Frequent Status Checks When Backgrounded
- **Before**: Checked every 2 seconds (both foreground and background)
- **After**: Checks every 1 second when backgrounded, 2 seconds when active
- **Why**: Faster detection of stopped recordings when screen is locked

### 2. Aggressive Recording Maintenance
- Reconfigure audio mode when going to background
- Check recording status immediately when backgrounded
- Check again after 1 second to catch delayed stops
- Automatic restart with retry logic

### 3. Better Duration Tracking
- Always use actual recording duration from status (not timer)
- Sync timer with actual recording duration when restarted
- Warn when there's a discrepancy

### 4. Improved Restart Logic
- Reconfigure audio mode before restarting
- Retry restart after 500ms if first attempt fails
- Only interrupt if recording stopped > 5 seconds ago

## Code Changes

### `components/recording-screen.tsx`

1. **Polling Interval** (lines 63-65):
   ```typescript
   const pollInterval = isBackgroundRecording ? 1000 : 2000
   ```
   - Checks every 1 second when backgrounded
   - Checks every 2 seconds when active

2. **Background Detection** (lines 168-230):
   - Reconfigures audio mode when going to background
   - Checks recording status immediately
   - Checks again after 1 second
   - More aggressive restart logic

3. **Status Check** (lines 80-97):
   - Reconfigures audio mode before restarting
   - Better error handling and logging
   - Syncs timer with actual recording duration

## Known Limitations

### Expo Go
- **Background recording may not work reliably in Expo Go**
- iOS may suspend the app when screen is locked
- For production, use a **development build** or **EAS Build**

### iOS System Behavior
- iOS may stop recording if:
  - Device goes to sleep
  - Low battery mode is enabled
  - Another app requests audio session
  - System memory is low

### Solutions

1. **Use Development Build** (Recommended):
   ```bash
   npx expo install expo-dev-client
   eas build --profile development --platform ios
   ```

2. **Migrate to expo-audio**:
   - `expo-av` is deprecated
   - `expo-audio` may have better background support
   - See `MIGRATION_TO_EXPO_AUDIO.md`

3. **Test on Real Device**:
   - Simulator doesn't support background recording
   - Test on physical iOS device
   - Use development build, not Expo Go

## Testing

To verify background recording works:

1. **Start recording**
2. **Lock the screen** (press power button)
3. **Wait 10-20 seconds**
4. **Unlock and check**:
   - Console should show "✅ Recording confirmed active"
   - If it shows "⚠️ RECORDING STOPPED", the restart logic should kick in
   - Check the actual audio file duration matches the saved duration

## Debugging

Check console logs for:
- `⚠️ RECORDING STOPPED!` - Recording stopped, attempting restart
- `✅ Recording restarted successfully` - Restart succeeded
- `❌ Failed to restart recording` - Restart failed (may need development build)
- Duration discrepancies - Timer vs actual recording duration

## Next Steps

If background recording still doesn't work:

1. **Build development client** (see `IOS_BUILD_GUIDE.md`)
2. **Test on real device** with development build
3. **Consider migrating to expo-audio** (see `MIGRATION_TO_EXPO_AUDIO.md`)
4. **Check iOS settings**:
   - Background App Refresh enabled
   - Low Power Mode disabled
   - No other apps using microphone

