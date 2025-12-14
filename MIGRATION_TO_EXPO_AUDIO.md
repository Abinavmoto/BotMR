# Migration Guide: expo-av → expo-audio

This guide documents the migration from deprecated `expo-av` to `expo-audio` in Expo SDK 54.

## Why Migrate?

- `expo-av` is deprecated and will be removed in future SDK versions
- `expo-audio` provides better performance and API design
- Better background recording support
- Improved audio session management

## Installation

```bash
npx expo install expo-audio
```

## Key API Differences

### Recording

**Old (expo-av):**
```typescript
import { Audio } from 'expo-av'

const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
)
await recording.startAsync()
```

**New (expo-audio):**
```typescript
import { useAudioRecorder, RecordingPresets } from 'expo-audio'

const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
await recorder.prepareToRecordAsync()
recorder.record()
```

### Playback

**Old (expo-av):**
```typescript
import { Audio } from 'expo-av'

const { sound } = await Audio.Sound.createAsync({ uri: audioUri })
await sound.playAsync()
```

**New (expo-audio):**
```typescript
import { useAudioPlayer } from 'expo-audio'

const player = useAudioPlayer(audioUri)
player.play()
```

### Audio Mode Configuration

**Old (expo-av):**
```typescript
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
})
```

**New (expo-audio):**
```typescript
import { setAudioModeAsync } from 'expo-audio'

await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true,
  staysActiveInBackground: true,
})
```

### Permissions

**Old (expo-av):**
```typescript
const { status } = await Audio.requestPermissionsAsync()
```

**New (expo-audio):**
```typescript
import { AudioModule } from 'expo-audio'

const { granted } = await AudioModule.requestRecordingPermissionsAsync()
```

## Migration Steps

1. **Install expo-audio**: `npx expo install expo-audio`
2. **Update imports**: Replace `expo-av` imports with `expo-audio`
3. **Update recording logic**: Use `useAudioRecorder` hook
4. **Update playback logic**: Use `useAudioPlayer` hook
5. **Update audio mode calls**: Use new `setAudioModeAsync` API
6. **Test thoroughly**: Especially background recording and playback

## Status

- ✅ Audio service V2 created (`src/services/audioServiceV2.ts`)
- ✅ Notification service created (`src/services/notificationService.ts`)
- ⏳ Recording screen migration (in progress)
- ⏳ Meeting detail screen migration (in progress)

## Notes

- Both `expo-av` and `expo-audio` can coexist during migration
- Test on real devices, not just simulators
- Background recording works better with development builds than Expo Go
