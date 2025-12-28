# State Machine Diagrams

## 1. Permission State Machine

```
┌─────────┐
│ UNKNOWN │ (Initial state)
└────┬────┘
     │ checkPermission()
     ▼
┌─────────────┐
│  CHECKING   │
└─────┬───────┘
      │
      ├─ granted ──────────────┐
      │                        ▼
      ├─ denied (can request) ─┼──► ┌──────────────┐
      │                        │    │   DENIED     │
      │                        │    └──────┬───────┘
      │                        │           │ requestPermission()
      │                        │           ▼
      │                        │    ┌──────────────┐
      │                        │    │ REQUESTING   │
      │                        │    └──────┬───────┘
      │                        │           │
      │                        │           ├─ granted ──┐
      │                        │           │            │
      │                        │           └─ denied ───┼──► ┌──────────┐
      │                        │                        │    │  DENIED   │
      │                        │                        │    └───────────┘
      │                        │                        │
      │                        │                        │
      └─ blocked ──────────────┼────────────────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   GRANTED    │
                         └──────────────┘
```

## 2. Recording State Machine

```
┌──────┐
│ IDLE │
└───┬───┘
    │ startRecording()
    ▼
┌──────────────────┐
│ CHECKING_PERM    │
└──────┬───────────┘
       │
       ├─ granted ───────────┐
       │                     │
       └─ not granted ───────┼──► ┌──────────────────┐
                             │    │ REQUESTING_PERM │
                             │    └──────┬──────────┘
                             │           │
                             │           ├─ granted ──┐
                             │           │            │
                             │           └─ denied ───┼──► ┌──────────────┐
                             │                        │    │ PERM_DENIED  │
                             │                        │    └──────────────┘
                             │                        │
                             │                        │
                             └────────────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │ INITIALIZING  │
                              └──────┬───────┘
                                     │
                                     ├─ success ──┐
                                     │            │
                                     └─ error ─────┼──► ┌───────┐
                                                   │    │ ERROR │
                                                   │    └───┬───┘
                                                   │        │
                                                   │        └─ handle ──┐
                                                   │                   │
                                                   ▼                   │
                                            ┌──────────┐              │
                                            │ RECORDING│              │
                                            └────┬─────┘              │
                                                 │                    │
                                                 ├─ pause() ──┐       │
                                                 │            │       │
                                                 │            ▼       │
                                                 │      ┌────────┐   │
                                                 │      │ PAUSED  │   │
                                                 │      └────┬────┘   │
                                                 │           │        │
                                                 │           └─ resume() ─┐
                                                 │                       │
                                                 └─ stop() ──────────────┼──► ┌──────────┐
                                                                         │    │ STOPPING │
                                                                         │    └────┬─────┘
                                                                         │         │
                                                                         │         ▼
                                                                         │    ┌──────────┐
                                                                         │    │  SAVING  │
                                                                         │    └────┬─────┘
                                                                         │         │
                                                                         │         └─ success ──┐
                                                                         │                      │
                                                                         └──────────────────────┘
                                                                                  │
                                                                                  ▼
                                                                           ┌──────────┐
                                                                           │   IDLE   │
                                                                           └──────────┘
```

## 3. Playback State Machine

```
┌──────┐
│ IDLE │
└───┬──┘
    │ loadAudio(uri)
    ▼
┌──────────┐
│ LOADING  │
└────┬─────┘
     │
     ├─ success ──┐
     │            │
     └─ error ─────┼──► ┌───────┐
                   │    │ ERROR │
                   │    └───┬───┘
                   │        │
                   │        └─ handle ──┐
                   │                    │
                   ▼                    │
            ┌──────────┐               │
            │  READY   │               │
            └────┬─────┘               │
                 │                     │
                 │ play()              │
                 ▼                     │
            ┌──────────┐               │
            │ PLAYING  │               │
            └────┬─────┘               │
                 │                     │
                 ├─ pause() ──┐       │
                 │            │       │
                 │            ▼       │
                 │      ┌────────┐    │
                 │      │ PAUSED │    │
                 │      └────┬───┘    │
                 │           │        │
                 │           └─ play() ─┐
                 │                      │
                 ├─ stop() ────────────┼──► ┌──────────┐
                 │                      │    │ STOPPING  │
                 │                      │    └────┬─────┘
                 │                      │         │
                 │                      │         ▼
                 │                      │    ┌──────────┐
                 │                      │    │ UNLOADING │
                 │                      │    └────┬─────┘
                 │                      │         │
                 │                      │         └─ complete ──┐
                 │                      │                       │
                 ├─ navigate away ──────┼───────────────────────┘
                 │                      │
                 ├─ app background ────┼──► ┌──────────┐
                 │                      │    │ PAUSED   │
                 │                      │    └──────────┘
                 │                      │
                 └─ finished ───────────┘
                                      │
                                      ▼
                               ┌──────────┐
                               │   IDLE   │
                               └──────────┘
```

## 4. Navigation State Machine

```
┌────────┐
│  HOME  │
└───┬────┘
    │
    ├─ tap record ────────────► ┌──────────┐
    │                            │ RECORDING│
    │                            └────┬─────┘
    │                                 │
    │                                 └─ stop/save ──┐
    │                                                │
    ├─ tap meeting ─────────────────────────────────┼──► ┌──────────────┐
    │                                                │    │ MEETING_DETAIL│
    │                                                │    └──────┬───────┘
    │                                                │           │
    │                                                │           └─ back ──┐
    │                                                │                     │
    │                                                │                     │
    ├─ tap settings ────────────────────────────────┼─────────────────────┼──► ┌──────────┐
    │                                                │                     │    │ SETTINGS │
    │                                                │                     │    └──────────┘
    │                                                │                     │
    │                                                │                     │
    └─ tap all meetings ─────────────────────────────┼─────────────────────┼──► ┌──────────────┐
                                                     │                     │    │ ALL_MEETINGS │
                                                     │                     │    └──────────────┘
                                                     │                     │
                                                     └─────────────────────┘
                                                                           │
                                                                           ▼
                                                                    ┌──────────┐
                                                                    │   HOME   │
                                                                    └──────────┘

Special Transitions:
- MEETING_DETAIL → HOME: MUST stop audio playback
- RECORDING → HOME: MUST stop recording and cleanup
- Any → RECORDING: MUST check permissions first
```

## 5. Combined App State Flow

```
App Start
    │
    ▼
┌─────────────────┐
│ Check Permissions│
└────────┬─────────┘
         │
         ├─ granted ───────────┐
         │                     │
         └─ not granted ───────┼──► ┌──────────────────┐
                               │    │ Store Permission │
                               │    │ State (don't     │
                               │    │  auto-request)   │
                               │    └──────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   HOME       │
                        └──────┬───────┘
                               │
                               ├─ User taps Record
                               │
                               ▼
                        ┌──────────────────┐
                        │ Request Permission│
                        └──────┬────────────┘
                               │
                               ├─ granted ──┐
                               │            │
                               └─ denied ────┼──► ┌──────────────────┐
                                             │    │ Show Info (don't │
                                             │    │  auto-redirect)  │
                                             │    └──────────────────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │  RECORDING   │
                                      └──────┬───────┘
                                             │
                                             └─ stop ──┐
                                                       │
                                                       ▼
                                                ┌──────────────┐
                                                │   HOME       │
                                                └──────┬───────┘
                                                       │
                                                       ├─ User taps Meeting
                                                       │
                                                       ▼
                                                ┌──────────────┐
                                                │ MEETING_DETAIL│
                                                └──────┬───────┘
                                                       │
                                                       ├─ User plays audio
                                                       │
                                                       ▼
                                                ┌──────────────┐
                                                │  PLAYING      │
                                                └──────┬───────┘
                                                       │
                                                       ├─ User taps back
                                                       │
                                                       ▼
                                                ┌──────────────┐
                                                │ STOP & UNLOAD │
                                                │   (MUST DO)   │
                                                └──────┬───────┘
                                                       │
                                                       ▼
                                                ┌──────────────┐
                                                │   HOME        │
                                                └───────────────┘
```

## Key State Transitions That Need Fixing

### 1. Permission Request Flow
**Current:** App opens → Recording screen → Auto-requests → If denied → Auto-redirects to settings
**Fixed:** App opens → Check permission → Store state → User taps record → Request permission → If denied → Show info (don't auto-redirect)

### 2. Audio Playback Cleanup
**Current:** Meeting detail → User taps back → Component unmounts → Cleanup runs → Audio might still play
**Fixed:** Meeting detail → User taps back → Stop audio → Unload audio → Await completion → Navigate to home

### 3. Navigation with Cleanup
**Current:** Navigation happens immediately, cleanup might not complete
**Fixed:** Navigation triggers cleanup → Await cleanup → Then navigate
