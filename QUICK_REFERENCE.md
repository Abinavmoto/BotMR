# Quick Reference Guide for Next Agent

## 🚀 Getting Started in 5 Minutes

### 1. Understand the Project
- Read `PROJECT_STATUS.md` for complete context
- Core feature: **Offline-first audio recording with background support**

### 2. Key Files to Know
```
index.js                    # App entry - foreground service registration
App.tsx                     # Main navigation
components/recording-screen.tsx    # Main recording logic
src/services/foregroundService.ts # Android foreground service
src/db/MeetingRepository.ts       # Database operations
```

### 3. Current State
- ✅ Recording works perfectly (foreground & background)
- ✅ Database persistence works
- ✅ UI is mostly complete
- ❌ Backend integration needed
- ❌ Processing/transcription pending

### 4. Common Tasks

#### Add a New Feature
1. Check `PROJECT_STATUS.md` to see if it's already done
2. Check existing components for patterns
3. Follow TypeScript types in `src/types/`
4. Update database schema if needed (add migration)

#### Debug Background Recording
1. Check `ANDROID_LOCK_SCREEN_TEST.md` for test steps
2. Verify foreground service is registered (check `index.js` logs)
3. Check notification permissions
4. Verify microphone permission is "Allow all the time"

#### Fix Audio Playback Issues
1. Check `AUDIO_PLAYBACK_EDGE_CASES.md`
2. Verify app state checks use `AppState.currentState` (not cached refs)
3. Check error suppression in `meeting-detail-screen.tsx`

### 5. Critical Patterns

#### ✅ DO
- Always check `AppState.currentState` (not cached refs)
- Start foreground service BEFORE `Audio.Recording.createAsync()`
- Clear all state/refs/intervals before navigation
- Use try-catch with proper error handling

#### ❌ DON'T
- Don't register foreground service in components (use index.js)
- Don't block playback on 'inactive' state (only 'background')
- Don't forget cleanup in useEffect returns
- Don't use deprecated expo-av patterns (see audioServiceV2.ts)

### 6. Testing Checklist
Before considering a feature complete:
- [ ] Works in foreground
- [ ] Works when screen locked
- [ ] Works when app backgrounded
- [ ] Persists after app restart
- [ ] Handles errors gracefully
- [ ] No memory leaks (check intervals/refs)

### 7. Next Priority Tasks
1. **Backend Integration** - Connect to API
2. **Edit Meeting Title** - Simple UI addition
3. **Delete Meeting** - Connect existing method to UI
4. **React Navigation** - Upgrade navigation system

### 8. Need Help?
- Check `PROJECT_STATUS.md` for detailed context
- Check implementation docs in root directory
- All fixes are documented with `.md` files

---

**Remember**: This app focuses on **offline-first** functionality. Always ensure features work without internet connection first, then add online sync.

