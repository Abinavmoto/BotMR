/**
 * Recording Controller Hook with State Machine
 * Manages recording state transitions and ensures idempotent operations
 */

import { useState, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'
import { Platform, AppState, AppStateStatus } from 'react-native'
import { configureAudioModeForRecording, resetAudioMode } from '@/src/services/audioService'
import { startForegroundService, stopForegroundService, forceStopForegroundService } from '@/src/services/foregroundService'

export type RecordingState = 'IDLE' | 'STARTING' | 'RECORDING' | 'STOPPING' | 'FAILED'

interface UseRecordingControllerOptions {
  onStateChange?: (state: RecordingState) => void
  onError?: (error: Error) => void
}

interface RecordingController {
  state: RecordingState
  recording: Audio.Recording | null
  durationMillis: number
  isPaused: boolean
  recordingStartTimestamp: number | null
  
  // Actions
  startRecording: () => Promise<boolean>
  pauseRecording: () => Promise<void>
  resumeRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  resetRecordingEngine: () => Promise<void>
  
  // State checks
  canStart: boolean
  canStop: boolean
  canPause: boolean
  canResume: boolean
}

export function useRecordingController(
  options: UseRecordingControllerOptions = {}
): RecordingController {
  const { onStateChange, onError } = options
  
  const [state, setState] = useState<RecordingState>('IDLE')
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [durationMillis, setDurationMillis] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingStartTimestamp, setRecordingStartTimestamp] = useState<number | null>(null)
  
  const recordingRef = useRef<Audio.Recording | null>(null)
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  
  // State transition helper
  const transitionTo = useCallback((newState: RecordingState) => {
    console.log(`[RecordingController] State transition: ${state} → ${newState}`)
    setState(newState)
    onStateChange?.(newState)
  }, [state, onStateChange])
  
  // Cleanup helper
  const cleanup = useCallback(async () => {
    // Clear intervals
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
    
    // Stop foreground service
    if (Platform.OS === 'android') {
      try {
        await stopForegroundService()
      } catch (error) {
        console.warn('⚠️ [RecordingController] Error stopping foreground service during cleanup:', error)
      }
    }
    
    // Reset audio mode
    try {
      await resetAudioMode()
    } catch (error) {
      console.warn('⚠️ [RecordingController] Error resetting audio mode during cleanup:', error)
    }
    
    // Clear refs
    recordingRef.current = null
    startTimeRef.current = null
    setRecording(null)
    setDurationMillis(0)
    setIsPaused(false)
    setRecordingStartTimestamp(null)
  }, [])
  
  // Reset recording engine
  const resetRecordingEngine = useCallback(async () => {
    console.log('[RecordingController] Resetting recording engine...')
    
    // Stop any active recording
    if (recordingRef.current) {
      try {
        // Check if methods exist before calling
        if (typeof recordingRef.current.getStatusAsync === 'function') {
          const status = await recordingRef.current.getStatusAsync()
          if ('isLoaded' in status && status.isLoaded && 'isRecording' in status && status.isRecording) {
            if (typeof recordingRef.current.stopAndUnloadAsync === 'function') {
              await recordingRef.current.stopAndUnloadAsync()
            } else if (typeof recordingRef.current.stopAsync === 'function' && typeof recordingRef.current.unloadAsync === 'function') {
              await recordingRef.current.stopAsync()
              await recordingRef.current.unloadAsync()
            }
          } else {
            if (typeof recordingRef.current.unloadAsync === 'function') {
              await recordingRef.current.unloadAsync()
            }
          }
        } else if (typeof recordingRef.current.unloadAsync === 'function') {
          await recordingRef.current.unloadAsync()
        }
      } catch (error) {
        console.warn('⚠️ [RecordingController] Error stopping recording during reset:', error)
      }
    }
    
    // Cleanup
    await cleanup()
    
    // Force stop foreground service
    if (Platform.OS === 'android') {
      await forceStopForegroundService()
    }
    
    // Reset state
    transitionTo('IDLE')
    
    console.log('[RecordingController] Recording engine reset complete')
  }, [cleanup, transitionTo])
  
  // Start recording
  const startRecording = useCallback(async (): Promise<boolean> => {
    // Prevent starting if already starting or stopping
    if (state === 'STARTING' || state === 'STOPPING') {
      console.warn(`[RecordingController] Cannot start: already ${state}`)
      return false
    }
    
    // If already recording, return success
    if (state === 'RECORDING') {
      console.log('[RecordingController] Already recording')
      return true
    }
    
    // If failed, need to reset first
    if (state === 'FAILED') {
      console.log('[RecordingController] Resetting from FAILED state before starting')
      await resetRecordingEngine()
    }
    
    transitionTo('STARTING')
    
    try {
      // Configure audio mode
      await configureAudioModeForRecording()
      
      // Start foreground service (Android) - use current timestamp
      const startTimestamp = Date.now()
      setRecordingStartTimestamp(startTimestamp)
      startTimeRef.current = startTimestamp
      
      if (Platform.OS === 'android') {
        const serviceStarted = await startForegroundService(startTimestamp)
        if (!serviceStarted) {
          console.error('[RecordingController] Foreground service failed to start')
          transitionTo('FAILED')
          onError?.(new Error('Foreground service failed to start'))
          return false
        }
      }
      
      // Create recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100 // Update interval
      )
      
      recordingRef.current = newRecording
      setRecording(newRecording)
      
      // Start status polling
      statusIntervalRef.current = setInterval(async () => {
        if (recordingRef.current && startTimeRef.current) {
          try {
            const status = await recordingRef.current.getStatusAsync()
            // Check for durationMillis directly (works for both loaded and unloaded status)
            if ('durationMillis' in status && status.durationMillis !== undefined && status.durationMillis !== null && status.durationMillis > 0) {
              // ALWAYS prioritize actual recording duration from status
              const actualDuration = status.durationMillis
              const timerDuration = Date.now() - startTimeRef.current
              // Use actual duration (more reliable), but fallback to timer if status is 0
              setDurationMillis(actualDuration > 0 ? actualDuration : timerDuration)
            } else {
              // Fallback to timer if status doesn't have duration
              const timerDuration = Date.now() - startTimeRef.current
              setDurationMillis(timerDuration)
            }
          } catch (error) {
            console.warn('⚠️ [RecordingController] Error polling status:', error)
            // Fallback to timer on error
            if (startTimeRef.current) {
              const timerDuration = Date.now() - startTimeRef.current
              setDurationMillis(timerDuration)
            }
          }
        }
      }, 1000) // Poll every second
      
      transitionTo('RECORDING')
      console.log('[RecordingController] Recording started successfully')
      return true
    } catch (error) {
      console.error('[RecordingController] Error starting recording:', error)
      transitionTo('FAILED')
      onError?.(error instanceof Error ? error : new Error(String(error)))
      await cleanup()
      return false
    }
  }, [state, transitionTo, resetRecordingEngine, cleanup, onError])
  
  // Pause recording
  const pauseRecording = useCallback(async () => {
    if (state !== 'RECORDING' || !recordingRef.current || isPaused) {
      return
    }
    
    try {
      await recordingRef.current.pauseAsync()
      setIsPaused(true)
      console.log('[RecordingController] Recording paused')
    } catch (error) {
      console.error('[RecordingController] Error pausing recording:', error)
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [state, isPaused, onError])
  
  // Resume recording
  const resumeRecording = useCallback(async () => {
    if (state !== 'RECORDING' || !recordingRef.current || !isPaused) {
      return
    }
    
    try {
      await recordingRef.current.startAsync()
      setIsPaused(false)
      console.log('[RecordingController] Recording resumed')
    } catch (error) {
      console.error('[RecordingController] Error resuming recording:', error)
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [state, isPaused, onError])
  
  // Stop recording
  const stopRecording = useCallback(async () => {
    // Prevent stopping if already stopping
    if (state === 'STOPPING') {
      console.warn('[RecordingController] Already stopping')
      return
    }
    
    // If not recording, just cleanup
    if (state !== 'RECORDING' && state !== 'STARTING') {
      await cleanup()
      transitionTo('IDLE')
      return
    }
    
    transitionTo('STOPPING')
    
    try {
      // Stop recording
      if (recordingRef.current) {
        try {
          // Check if recording object has the required methods
          if (typeof recordingRef.current.getStatusAsync === 'function') {
            const status = await recordingRef.current.getStatusAsync()
            if ('isLoaded' in status && status.isLoaded && 'isRecording' in status && status.isRecording) {
              if (typeof recordingRef.current.stopAndUnloadAsync === 'function') {
                await recordingRef.current.stopAndUnloadAsync()
              } else if (typeof recordingRef.current.stopAsync === 'function' && typeof recordingRef.current.unloadAsync === 'function') {
                await recordingRef.current.stopAsync()
                await recordingRef.current.unloadAsync()
              }
            } else {
              if (typeof recordingRef.current.unloadAsync === 'function') {
                await recordingRef.current.unloadAsync()
              }
            }
          } else if (typeof recordingRef.current.unloadAsync === 'function') {
            // Fallback: just unload if status check fails
            await recordingRef.current.unloadAsync()
          }
        } catch (error) {
          console.warn('⚠️ [RecordingController] Error stopping recording:', error)
          // Try to unload anyway if stop failed
          try {
            if (recordingRef.current && typeof recordingRef.current.unloadAsync === 'function') {
              await recordingRef.current.unloadAsync()
            }
          } catch (unloadError) {
            console.warn('⚠️ [RecordingController] Error unloading after stop failed:', unloadError)
          }
        }
      }
      
      // Cleanup
      await cleanup()
      
      // Transition to IDLE
      transitionTo('IDLE')
      console.log('[RecordingController] Recording stopped successfully')
    } catch (error) {
      console.error('[RecordingController] Error stopping recording:', error)
      transitionTo('FAILED')
      onError?.(error instanceof Error ? error : new Error(String(error)))
      await cleanup()
    }
  }, [state, cleanup, transitionTo, onError])
  
  // State checks
  const canStart = state === 'IDLE' || state === 'FAILED'
  const canStop = state === 'RECORDING' || state === 'STARTING'
  const canPause = state === 'RECORDING' && !isPaused
  const canResume = state === 'RECORDING' && isPaused
  
  return {
    state,
    recording,
    durationMillis,
    isPaused,
    recordingStartTimestamp,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecordingEngine,
    canStart,
    canStop,
    canPause,
    canResume,
  }
}
