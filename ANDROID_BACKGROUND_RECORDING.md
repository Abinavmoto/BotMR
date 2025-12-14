# Android Background Recording Setup

## Issue: "Only while using app" Permission

When you select **"Only while using app"** for microphone permission, Android restricts recording when:
- Screen is locked
- App goes to background
- Another app is in foreground

## Solution: Use "Allow all the time"

For background recording to work properly on Android, you need to:

1. **Go to Settings** → **Apps** → **BotMR** → **Permissions** → **Microphone**
2. **Select "Allow all the time"** (not "Only while using app")

This allows recording to continue when:
- Screen is locked ✅
- App is in background ✅
- Another app is active ✅

## Why This is Needed

Android 11+ introduced granular permission levels:
- **"Only while using app"**: Recording stops when app loses focus
- **"Allow all the time"**: Recording continues in background

## What We've Configured

### 1. Added Required Permissions

In `app.json`, we've added:
- `FOREGROUND_SERVICE` - Required for background services
- `FOREGROUND_SERVICE_MICROPHONE` - Required for background audio recording (Android 14+)
- `WAKE_LOCK` - Keeps device awake during recording

### 2. Foreground Service

The app uses a foreground service (via expo-av) which:
- Shows a persistent notification during recording
- Keeps the recording active in background
- Prevents Android from killing the recording process

### 3. Permission Guidance

The app now shows an alert explaining:
- Why "Allow all the time" is needed
- How to change the permission in Settings

## Testing

After setting permission to "Allow all the time":

1. Start recording
2. Lock screen
3. Wait 30+ seconds
4. Unlock and check:
   - Recording should have continued
   - Audio should be captured properly
   - Duration should match actual recording

## Troubleshooting

### "Recording stops when screen locks"
- Check permission is set to "Allow all the time"
- Settings → Apps → BotMR → Permissions → Microphone

### "No audio captured"
- Check microphone permission is granted
- Try recording with screen unlocked first
- Check if another app is using microphone

### "Permission dialog doesn't show 'Allow all the time'"
- Some Android versions require you to:
  1. First grant "Only while using app"
  2. Then go to Settings and change to "Allow all the time"
- This is an Android system limitation

## Alternative: Foreground Service Notification

The app shows a notification during recording which:
- Indicates recording is active
- Helps Android keep the service alive
- Provides user feedback

This notification is required for background recording on Android.

## Next Steps

1. **Change permission to "Allow all the time"**
2. **Test background recording**
3. **Verify audio is captured properly**

The code is already configured - you just need to change the permission level in Android Settings!
