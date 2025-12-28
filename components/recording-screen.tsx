import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, AppState, AppStateStatus, Platform, Linking, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import * as Crypto from 'expo-crypto'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Colors } from '@/constants/Colors'
import { MeetingRepository } from '@/src/db/MeetingRepository'
import { saveRecordingToPermanentLocation, configureAudioModeForRecording, resetAudioMode } from '@/src/services/audioService'
import * as FileSystem from 'expo-file-system/legacy'
import {
  showRecordingNotification,
  updateRecordingNotification,
  cancelRecordingNotification,
  showRecordingStoppedNotification,
} from '@/src/services/notificationService'
import {
  startForegroundService,
  stopForegroundService,
  isForegroundServiceActive,
  createForegroundServiceChannel,
  registerForegroundServiceHandler,
} from '@/src/services/foregroundService'
import { useRecordingController } from '@/src/hooks/useRecordingController'
import { NavigationHandler } from '@/src/types/navigation'

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | null

interface RecordingScreenProps {
  onNavigate: NavigationHandler
  permissionStatus?: PermissionStatus
  onPermissionStatusChange?: (status: PermissionStatus) => void
}

export function RecordingScreen({ onNavigate, permissionStatus: propPermissionStatus, onPermissionStatusChange }: RecordingScreenProps) {
  const [showBackgroundNotice, setShowBackgroundNotice] = useState(true)
  const [isBackgroundRecording, setIsBackgroundRecording] = useState(false)
  const [interruptionMessage, setInterruptionMessage] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  // Use prop permission status if provided, otherwise use local state
  const permissionStatus = propPermissionStatus !== undefined ? propPermissionStatus : (hasPermission === true ? 'granted' : hasPermission === false ? 'denied' : 'undetermined')
  const [preBackgroundWarning, setPreBackgroundWarning] = useState(false) // Show warning before going to background
  const [foregroundServiceActive, setForegroundServiceActive] = useState(false)
  const [durationMillis, setDurationMillis] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [showSavedToast, setShowSavedToast] = useState(false)
  
  const recordingRef = useRef<Audio.Recording | null>(null)
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const interruptionCheckRef = useRef<NodeJS.Timeout | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const handleInterruptionRef = useRef(false)
  const startTimeRef = useRef<number | null>(null)
  const foregroundServiceNotificationIdRef = useRef<string | null>(null)
  
  // Use recording controller hook with state machine
  const recordingController = useRecordingController({
    onStateChange: (newState) => {
      console.log(`[RecordingScreen] Recording state changed to: ${newState}`)
      // Update UI state based on recording state
      if (newState === 'RECORDING') {
        setIsBackgroundRecording(false)
        setIsRecording(true)
      } else if (newState === 'IDLE' || newState === 'FAILED') {
        setIsBackgroundRecording(false)
        setIsRecording(false)
      }
    },
    onError: (error) => {
      console.error('[RecordingScreen] Recording error:', error)
      Alert.alert('Recording Error', error.message || 'An error occurred during recording')
    },
  })
  
  // Derive UI state from controller
  const recordingState = recordingController.state
  const isStarting = recordingState === 'STARTING'
  const isStopping = recordingState === 'STOPPING'
  const isFailed = recordingState === 'FAILED'
  
  // Sync controller state with local state
  useEffect(() => {
    if (recordingController.recording) {
      recordingRef.current = recordingController.recording
      setRecording(recordingController.recording)
    } else if (recordingController.state === 'IDLE' || recordingController.state === 'FAILED') {
      // Clear ref when not recording
      recordingRef.current = null
      setRecording(null)
    }
    if (recordingController.durationMillis !== undefined) {
      setDurationMillis(recordingController.durationMillis)
    }
    setIsPaused(recordingController.isPaused)
  }, [recordingController.recording, recordingController.durationMillis, recordingController.isPaused, recordingController.state])

  useEffect(() => {
    // Don't auto-request permissions on mount
    // Only check if we have permission status from props
    if (propPermissionStatus === 'granted') {
      setHasPermission(true)
    } else if (propPermissionStatus === 'denied') {
      setHasPermission(false)
    }
    
    // Note: Foreground service handler is registered in App.tsx on app startup
    // No need to register here - it's already registered globally
    return () => {
      cleanup()
    }
  }, [propPermissionStatus])

  // Track app state changes for background recording detection
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [isRecording])

  // Poll recording status for accurate duration (works even when app is backgrounded)
  useEffect(() => {
    if (isRecording && !isPaused && recordingRef.current) {
      // Clear any existing interval first
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
        statusIntervalRef.current = null
      }

      // Poll more frequently when backgrounded to catch stopped recordings quickly
      // Use fallback timer as primary source for reliability in background
      const pollInterval = isBackgroundRecording ? 1000 : 2000 // 1 second when backgrounded, 2 seconds when active
      
      statusIntervalRef.current = setInterval(async () => {
        try {
          let currentDuration = 0
          
          // Primary: Use fallback timer (works reliably in background)
          if (startTimeRef.current) {
            currentDuration = Date.now() - startTimeRef.current
            setDurationMillis(currentDuration)
          }
          
          // CRITICAL: Check recording status and maintain it (especially important when backgrounded)
          if (recordingRef.current) {
            try {
              const status = await recordingRef.current.getStatusAsync()
              // Check if status has recording info
              if ('isRecording' in status || 'durationMillis' in status) {
                // CRITICAL: If recording stopped, try to restart it immediately
                const isCurrentlyRecording = 'isRecording' in status ? status.isRecording : false
                if (!isCurrentlyRecording && !isPaused) {
                  const actualDuration = status.durationMillis || 0
                  const timerDuration = currentDuration
                  const difference = Math.abs(timerDuration - actualDuration)
                  
                  console.warn('⚠️ RECORDING STOPPED! Attempting to restart...')
                  console.warn('Status duration:', actualDuration, 'ms (', Math.floor(actualDuration / 1000), 's)')
                  console.warn('Timer duration:', timerDuration, 'ms (', Math.floor(timerDuration / 1000), 's)')
                  console.warn('Difference:', difference, 'ms - Recording stopped', Math.floor(difference / 1000), 'seconds ago')
                  
                  // Try to restart recording
                  try {
                    // Reconfigure audio mode before restarting (might have been reset)
                    if (isBackgroundRecording) {
                      try {
                        await configureAudioModeForRecording()
                        await new Promise(resolve => setTimeout(resolve, 200))
                      } catch (audioModeError) {
                        console.warn('Error reconfiguring audio mode (non-critical):', audioModeError)
                      }
                    }
                    
                    await recordingRef.current.startAsync()
                    console.log('✅ Recording restarted successfully')
                    
                    // Update start time to match actual recording duration
                    if (actualDuration > 0) {
                      startTimeRef.current = Date.now() - actualDuration
                      setDurationMillis(actualDuration)
                    }
                  } catch (restartError) {
                    console.error('❌ Failed to restart recording:', restartError)
                    // If restart fails multiple times, handle as interruption
                    if (!handleInterruptionRef.current && difference > 5000) {
                      // Only interrupt if recording stopped more than 5 seconds ago
                      console.error('Recording cannot be restarted after', Math.floor(difference / 1000), 'seconds - saving available audio')
                      handleInterruption('Recording stopped unexpectedly. Saving available audio...')
                    }
                  }
                } else if (('isRecording' in status && status.isRecording) && ('durationMillis' in status && status.durationMillis)) {
                  const statusDuration = status.durationMillis
                  // Use status duration if it's reasonable (within 3 seconds of our calculation)
                  const diff = Math.abs(statusDuration - currentDuration)
                  if (diff < 3000) {
                    currentDuration = statusDuration
                    setDurationMillis(currentDuration)
                    // Sync start time ref to match status
                    startTimeRef.current = Date.now() - statusDuration
                  } else if (isBackgroundRecording) {
                    // When backgrounded, if there's a discrepancy, the recording might have stopped
                    console.warn('⚠️ Duration discrepancy when backgrounded:', diff, 'ms')
                    console.warn('Status:', statusDuration, 'ms, Timer:', currentDuration, 'ms')
                  }
                }
              }
            } catch (statusError) {
              // If status check fails, continue with fallback timer
              console.warn('Status check failed, using fallback timer:', statusError)
              // When backgrounded, status checks might fail more often - this is OK
            }
          }
          
          // Update background notification only when app is backgrounded
          if (isBackgroundRecording) {
            const durationSeconds = Math.floor(currentDuration / 1000)
            if (durationSeconds > 0) {
              // Update notification every 5 seconds when backgrounded (to avoid spam)
              if (durationSeconds % 5 === 0) {
                if (Platform.OS === 'android') {
                  // Notification uses static text, no need to update
                } else {
                  updateRecordingNotification(durationSeconds).catch(console.error)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in timer interval:', error)
          // Fallback: calculate duration from start time on error
          if (startTimeRef.current) {
            const elapsed = Date.now() - startTimeRef.current
            setDurationMillis(elapsed)
          }
        }
      }, pollInterval)
      } else {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current)
          statusIntervalRef.current = null
        }
        if (!isRecording) {
          startTimeRef.current = null
        }
      }

      return () => {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current)
          statusIntervalRef.current = null
        }
      }
    }, [isRecording, isPaused, isBackgroundRecording]) // Include isBackgroundRecording to adjust interval

  // Handle app state changes (background/foreground)
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const previousAppState = appStateRef.current
    appStateRef.current = nextAppState

    if (isRecording && recordingRef.current) {
      if (previousAppState === 'active' && nextAppState.match(/inactive|background/)) {
        // App is about to go to background
        console.log('App going to background - checking foreground service status')
        
        // CRITICAL: On Android, verify foreground service is active
        if (Platform.OS === 'android') {
          const serviceActive = await isForegroundServiceActive()
          if (!serviceActive && !foregroundServiceActive) {
            // Foreground service is missing - try to restart it
            console.warn('⚠️ Foreground service not active - attempting to restart')
            // Restart foreground service with current timestamp
            const currentTimestamp = startTimeRef.current || Date.now()
            const restarted = await startForegroundService(currentTimestamp)
            
            if (!restarted) {
              // Failed to restart - stop recording safely
              console.error('❌ Failed to restart foreground service - stopping recording to prevent silent failure')
              
              const uri = recordingRef.current.getURI()
              if (uri) {
                const status = await recordingRef.current.getStatusAsync()
                const actualDuration = ('durationMillis' in status && status.durationMillis) ? status.durationMillis : durationMillis
                const durationSeconds = Math.max(0, Math.floor(actualDuration / 1000))
                
                await stopRecordingInternal()
                await resetAudioMode()
                
                // Save partial recording
                if (durationSeconds > 0) {
                  const meetingId = await Crypto.randomUUID()
                  const permanentUri = await saveRecordingToPermanentLocation(uri, meetingId)
                  
                  await MeetingRepository.createMeeting({
                    title: `Meeting ${new Date().toLocaleDateString()} (Partial)`,
                    duration_sec: durationSeconds,
                    local_audio_uri: permanentUri,
                    status: 'recorded_partial',
                    error_message: 'Recording stopped: Android requires a foreground service to record in background.',
                  })
                  
                  Alert.alert(
                    'Recording Stopped',
                    'Recording stopped by Android to protect your privacy. Your audio has been saved.',
                    [{ text: 'OK', onPress: () => onNavigate('home') }],
                  )
                } else {
                  Alert.alert(
                    'Recording Stopped',
                    'Android requires a foreground service to record in background. Please check notification permissions.',
                    [
                      { text: 'Cancel', style: 'cancel', onPress: () => onNavigate('home') },
                      {
                        text: 'Open Settings',
                        onPress: () => {
                          Linking.openSettings()
                          onNavigate('home')
                        },
                      },
                    ],
                  )
                }
              }
              return
            } else {
              // Successfully restarted
              setForegroundServiceActive(true)
              foregroundServiceNotificationIdRef.current = 'foreground-service-active'
              console.log('✅ Foreground service restarted successfully')
            }
          }
          
          // Show banner before backgrounding
          setPreBackgroundWarning(true)
          setTimeout(() => setPreBackgroundWarning(false), 3000)
        }
        
        // App went to background - recording should continue
        setIsBackgroundRecording(true)
        console.log('App backgrounded - recording continues with foreground service')
        
        // Update notification with current duration
        const durationSeconds = Math.floor(durationMillis / 1000)
        if (Platform.OS === 'android') {
          // Update foreground service notification
          // Notification uses static text, no need to update
          // Removed updateForegroundService call
        } else {
          showRecordingNotification(durationSeconds).catch(console.error)
        }
        
        // CRITICAL: Verify and maintain recording when backgrounded
        const checkAndMaintainRecording = async () => {
          try {
            if (recordingRef.current) {
              // Reconfigure audio mode to ensure background recording is enabled
              try {
                await configureAudioModeForRecording()
                await new Promise(resolve => setTimeout(resolve, 200))
              } catch (audioModeError) {
                console.warn('Error reconfiguring audio mode when backgrounded:', audioModeError)
              }
              
              const status = await recordingRef.current.getStatusAsync()
              if ('durationMillis' in status || 'isRecording' in status) {
                const isCurrentlyRecording = 'isRecording' in status ? status.isRecording : false
                if (!isCurrentlyRecording && !isPaused) {
                  const actualDuration = status.durationMillis || 0
                  console.error('⚠️ Recording stopped when backgrounded!')
                  console.error('Status duration:', actualDuration, 'ms (', Math.floor(actualDuration / 1000), 's)')
                  console.error('Timer duration:', Math.floor(durationMillis / 1000), 's')
                  
                  // Try to restart recording if it stopped
                  try {
                    await recordingRef.current.startAsync()
                    console.log('✅ Recording restarted successfully after backgrounding')
                    
                    // Sync timer with actual recording duration
                    if (actualDuration > 0) {
                      startTimeRef.current = Date.now() - actualDuration
                      setDurationMillis(actualDuration)
                    }
                  } catch (restartError) {
                    console.error('❌ Failed to restart recording:', restartError)
                    // If restart fails, handle as interruption
                    handleInterruption('Recording stopped. Partial audio saved.')
                  }
                } else if (('isRecording' in status && status.isRecording) || ('durationMillis' in status && status.durationMillis && status.durationMillis > 0)) {
                  const statusDuration = 'durationMillis' in status ? status.durationMillis : 0
                  console.log('✅ Recording confirmed active when backgrounded, duration:', statusDuration, 'ms')
                  // Sync timer with actual recording duration
                  if (statusDuration > 0) {
                    startTimeRef.current = Date.now() - statusDuration
                    setDurationMillis(statusDuration)
                  }
                } else {
                  // Recording might have stopped - log warning but don't interrupt
                  console.warn('⚠️ Recording status unclear when backgrounded - continuing with timer')
                }
              }
            }
          } catch (error) {
            console.error('Error checking recording status when backgrounded:', error)
            // Don't interrupt - continue with fallback timer
          }
        }
        
        // Check immediately
        checkAndMaintainRecording()
        
        // Also check again after 1 second to catch any delayed stops
        setTimeout(checkAndMaintainRecording, 1000)
      } else if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        setIsBackgroundRecording(false)
        console.log('App foregrounded - refreshing recording status')
        
        // Cancel background notification when app comes to foreground (iOS only)
        // Android foreground service stays active but we can update it
        if (Platform.OS !== 'android') {
          cancelRecordingNotification().catch(console.error)
        }
        
        // Immediately refresh duration - prioritize fallback timer for accuracy
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current
          setDurationMillis(elapsed)
        }
        
        // Try to sync with recording status if available (but don't rely on it)
        try {
          if (recordingRef.current) {
            const status = await recordingRef.current.getStatusAsync()
            if (('isRecording' in status && status.isRecording) || ('durationMillis' in status && status.durationMillis)) {
              const statusDuration = status.durationMillis || 0
              // Only use status if it's close to our fallback calculation
              if (startTimeRef.current) {
                const fallbackDuration = Date.now() - startTimeRef.current
                const diff = Math.abs(statusDuration - fallbackDuration)
                if (diff < 3000) {
                  // Status is close, sync our start time to match
                  startTimeRef.current = Date.now() - statusDuration
                  setDurationMillis(statusDuration)
                }
              }
            } else if (!status.isRecording && !isPaused) {
              // Check if recording was interrupted
              handleInterruption('Recording was interrupted. Saving available audio...')
            }
          }
        } catch (error) {
          console.error('Error refreshing recording status:', error)
          // Continue with fallback timer - this is fine
        }
      }
    }
  }

  // Handle recording interruptions (calls, other audio, OS blocks, etc.)
  const handleInterruption = async (message: string, isPartial: boolean = true) => {
    // Prevent multiple simultaneous interruption handlers
    if (handleInterruptionRef.current) {
      return
    }
    handleInterruptionRef.current = true

    console.warn('Recording interruption detected:', message)
    setInterruptionMessage(message)
    
    try {
      // Stop foreground service (Android) or cancel notification (iOS)
      if (Platform.OS === 'android') {
        await stopForegroundService()
      } else {
        await cancelRecordingNotification()
      }
      
      // Finalize and save what we have
      if (recordingRef.current) {
        const uri = recordingRef.current.getURI()
        if (uri) {
          // Get final duration from recording status (actual recording duration, not timer)
          const finalStatus = await recordingRef.current.getStatusAsync()
          let finalDurationMillis = durationMillis
          
          if ('durationMillis' in finalStatus && finalStatus.durationMillis) {
            finalDurationMillis = finalStatus.durationMillis
          } else if (startTimeRef.current) {
            finalDurationMillis = Date.now() - startTimeRef.current
          }
          
          const currentDuration = Math.max(0, Math.floor(finalDurationMillis / 1000))
          
          await stopRecordingInternal()
          await resetAudioMode()

          if (currentDuration > 0) {
            // Save the partial recording
            const meetingId = await Crypto.randomUUID()
            const permanentUri = await saveRecordingToPermanentLocation(uri, meetingId)
            
            const status = isPartial ? 'recorded_partial' : 'recorded'
            const title = isPartial 
              ? `Meeting ${new Date().toLocaleDateString()} (Partial)`
              : `Meeting ${new Date().toLocaleDateString()}`
            
            await MeetingRepository.createMeeting({
              title,
              duration_sec: currentDuration,
              local_audio_uri: permanentUri,
              status,
              error_message: isPartial ? message : undefined,
            })
            
            // Show user-friendly message
            const userMessage = isPartial
              ? 'Recording stopped by Android to protect your privacy. Your audio has been saved.'
              : 'Recording stopped. Your audio has been saved.'
            
            Alert.alert('Recording Stopped', userMessage, [
              { text: 'OK', onPress: () => onNavigate('home') },
            ])
          } else {
            // No audio recorded
            Alert.alert(
              'Recording Stopped',
              'Recording stopped before any audio was captured.',
              [{ text: 'OK', onPress: () => onNavigate('home') }],
            )
          }
        } else {
          // No URI available
          await stopRecordingInternal()
          await resetAudioMode()
          Alert.alert(
            'Recording Stopped',
            'Recording stopped. No audio data was available to save.',
            [{ text: 'OK', onPress: () => onNavigate('home') }],
          )
        }
      } else {
        await resetAudioMode()
        onNavigate('home')
      }
      
      handleInterruptionRef.current = false
    } catch (error) {
      console.error('Error handling interruption:', error)
      handleInterruptionRef.current = false
      Alert.alert(
        'Recording Interrupted',
        'The recording was interrupted and could not be saved.',
        [{ text: 'OK', onPress: () => onNavigate('home') }],
      )
      await stopRecordingInternal()
      await resetAudioMode()
      onNavigate('home')
    }
  }

  // Set up interruption listeners
  useEffect(() => {
    if (!recordingRef.current || !isRecording) {
      if (interruptionCheckRef.current) {
        clearInterval(interruptionCheckRef.current)
        interruptionCheckRef.current = null
      }
      return
    }

    // Set up status update listener to detect interruptions
    const checkStatus = async () => {
      try {
        if (recordingRef.current && !handleInterruptionRef.current) {
          const status = await recordingRef.current.getStatusAsync()
              if ('durationMillis' in status || 'isRecording' in status) {
            // Check if recording stopped unexpectedly
            if (!status.isRecording && !isPaused) {
              handleInterruption('Recording stopped unexpectedly')
            }
          }
        }
      } catch (error) {
        console.error('Error checking recording status:', error)
      }
    }

    // Check status every 2 seconds for interruptions
    interruptionCheckRef.current = setInterval(checkStatus, 2000)

    return () => {
      if (interruptionCheckRef.current) {
        clearInterval(interruptionCheckRef.current)
        interruptionCheckRef.current = null
      }
    }
  }, [isRecording, isPaused])

  const cleanup = async () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
    if (interruptionCheckRef.current) {
      clearInterval(interruptionCheckRef.current)
      interruptionCheckRef.current = null
    }
    await cancelRecordingNotification()
    await stopRecordingInternal()
    await resetAudioMode()
  }

  const requestPermissions = async () => {
    try {
      // Check current permission status first
      const { status: currentStatus } = await Audio.getPermissionsAsync()
      if (currentStatus === 'granted') {
        setHasPermission(true)
        if (onPermissionStatusChange) {
          onPermissionStatusChange('granted')
        }
        return true
      }

      // Request permission if not granted
      const { status } = await Audio.requestPermissionsAsync()
      const granted = status === 'granted'
      setHasPermission(granted)
      
      // Update parent permission status
      if (onPermissionStatusChange) {
        onPermissionStatusChange(granted ? 'granted' : 'denied')
      }
      
      if (!granted) {
        // Don't auto-redirect to settings - let user choose
        Alert.alert(
          'Microphone Permission Required',
          'BotMR needs microphone access to record meetings. You can enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // On Android, this will open app settings
                // User should select "Allow all the time" for background recording
                if (Platform.OS === 'android') {
                  Linking.openSettings()
                }
              },
            },
          ],
        )
      } else {
        // On Android, check if we need to request "Allow all the time" for background
        if (Platform.OS === 'android') {
          // Note: expo-av doesn't expose the permission level, but we can inform the user
          Alert.alert(
            'Background Recording',
            'For recording when the screen is locked, please ensure microphone permission is set to "Allow all the time" in Settings → Apps → BotMR → Permissions → Microphone.',
            [{ text: 'OK' }],
          )
        }
      }
      
      // NOTE: Do NOT configure audio mode here - it will be configured in startRecording()
      // Configuring it here can cause session conflicts
      
      return granted
    } catch (error) {
      console.error('Error requesting permissions:', error)
      setHasPermission(false)
      if (onPermissionStatusChange) {
        onPermissionStatusChange('denied')
      }
      Alert.alert('Error', 'Failed to request microphone permission.')
      return false
    }
  }

  const startRecording = async () => {
    // Check permission status - request if not granted
    const currentPermissionStatus = permissionStatus === 'granted' || hasPermission === true
    
    if (!currentPermissionStatus) {
      // Request permission when user actually wants to record
      const permissionGranted = await requestPermissions()
      if (!permissionGranted) {
        // Don't show alert here - requestPermissions already shows one
        return
      }
    }

    // Double-check permission before proceeding
    try {
      const { status } = await Audio.getPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required to record.')
        setHasPermission(false)
        return
      }
    } catch (permError) {
      console.error('Error checking permissions:', permError)
      Alert.alert('Error', 'Failed to verify microphone permission.')
      return
    }

    // Use recording controller to start
    const started = await recordingController.startRecording()
    if (!started) {
      // Error already handled by controller
      return
    }
    
    // Sync local state with controller - wait a moment for recording to be set
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (recordingController.recording) {
      recordingRef.current = recordingController.recording
      setRecording(recordingController.recording)
      setIsRecording(true)
    }
    if (recordingController.recordingStartTimestamp) {
      startTimeRef.current = recordingController.recordingStartTimestamp
    }
    
    // For iOS, show informational notification
    if (Platform.OS !== 'android') {
      showRecordingStoppedNotification('Recording started').catch(console.error)
    }
    
    console.log('Recording started successfully, will continue in background')
  }

  const pauseRecording = async () => {
    if (!recordingController.canPause) return
    await recordingController.pauseRecording()
  }

  const resumeRecording = async () => {
    if (!recordingController.canResume) return
    await recordingController.resumeRecording()
  }
  
  const resetRecordingEngine = async () => {
    await recordingController.resetRecordingEngine()
    // Clear local state
    setIsBackgroundRecording(false)
    setInterruptionMessage(null)
    setShowBackgroundNotice(true)
  }

  const stopRecordingInternal = async () => {
    try {
      // Use recording controller to stop (handles foreground service and cleanup)
      await recordingController.stopRecording()
      
      // Clear local state
      setForegroundServiceActive(false)
      foregroundServiceNotificationIdRef.current = null
      setIsBackgroundRecording(false)
      
      // Clear interruption check interval
      if (interruptionCheckRef.current) {
        clearInterval(interruptionCheckRef.current)
        interruptionCheckRef.current = null
      }
    } catch (error) {
      console.error('❌ [stopRecordingInternal] Error stopping recording:', error)
    }
  }

  const stopRecording = async () => {
    // Use recording from controller if available, otherwise use local ref
    const currentRecording = recordingController.recording || recordingRef.current
    if (!currentRecording) {
      console.warn('⚠️ No recording object available to stop')
      await stopRecordingInternal()
      await resetAudioMode()
      onNavigate('home')
      return
    }

    try {
      setIsRecording(false)
      setIsPaused(false)

      // CRITICAL: Get URI before stopping - once stopped, URI might be invalid
      let uri: string | null = null
      try {
        if (typeof currentRecording.getURI === 'function') {
          uri = currentRecording.getURI()
        } else if ('uri' in currentRecording && typeof currentRecording.uri === 'string') {
          uri = currentRecording.uri
        }
        
        console.log('📹 [RecordingScreen] Got recording URI:', uri)
        
        if (!uri) {
          console.error('❌ [RecordingScreen] No recording URI available')
          Alert.alert('Error', 'No recording data available.')
          await stopRecordingInternal()
          await resetAudioMode()
          onNavigate('home')
          return
        }
        
        // Verify URI is valid (not empty, has proper format)
        if (!uri || uri.trim().length === 0) {
          console.error('❌ [RecordingScreen] Recording URI is empty')
          Alert.alert('Error', 'Recording URI is invalid.')
          await stopRecordingInternal()
          await resetAudioMode()
          onNavigate('home')
          return
        }
      } catch (uriError) {
        console.error('❌ [RecordingScreen] Error getting recording URI:', uriError)
        Alert.alert('Error', 'Failed to get recording URI. The recording may not have been saved correctly.')
        await stopRecordingInternal()
        await resetAudioMode()
        onNavigate('home')
        return
      }

      // CRITICAL: Get actual recording duration from the recording object
      // This is the REAL duration that was actually recorded, not the timer
      const finalStatus = await currentRecording.getStatusAsync()
      let finalDurationMillis = 0
      
      // ALWAYS prioritize the actual recording duration from status
      // Check for durationMillis property directly (works for both loaded and unloaded status)
      if ('durationMillis' in finalStatus && finalStatus.durationMillis !== undefined && finalStatus.durationMillis !== null && finalStatus.durationMillis > 0) {
        finalDurationMillis = finalStatus.durationMillis
        console.log('✅ Using actual recording duration from status:', finalDurationMillis, 'ms')
      } else {
        // If status doesn't have duration, try to get it one more time after a small delay
        console.warn('⚠️ Recording status missing duration, retrying...')
        await new Promise(resolve => setTimeout(resolve, 300))
        const retryStatus = await currentRecording.getStatusAsync()
        if ('durationMillis' in retryStatus && retryStatus.durationMillis && retryStatus.durationMillis > 0) {
          finalDurationMillis = retryStatus.durationMillis
          console.log('✅ Got duration on retry:', finalDurationMillis, 'ms')
        } else {
          // Last resort: use timer, but log a warning
          const timerDuration = startTimeRef.current ? (Date.now() - startTimeRef.current) : durationMillis
          const statusDuration = ('durationMillis' in retryStatus ? retryStatus.durationMillis : 0) || ('durationMillis' in finalStatus ? finalStatus.durationMillis : 0) || 0
          
          console.warn('⚠️ WARNING: Using timer duration as fallback - actual recording may be shorter!')
          console.warn('   Timer duration:', timerDuration, 'ms')
          console.warn('   Status duration:', statusDuration, 'ms')
          
          // Use the larger of timer or status (status is more reliable if available)
          finalDurationMillis = Math.max(timerDuration, statusDuration)
          
          if (statusDuration > 0 && timerDuration === 0) {
            // Status has duration but timer doesn't - use status
            finalDurationMillis = statusDuration
            console.log('✅ Using status duration (timer was 0):', finalDurationMillis, 'ms')
          }
        }
      }
      
      const durationSeconds = Math.max(0, Math.floor(finalDurationMillis / 1000))
      console.log('Saving recording with ACTUAL duration:', durationSeconds, 'seconds (', finalDurationMillis, 'ms)')
      
      // Warn if there's a significant discrepancy between timer and actual recording
      if (startTimeRef.current) {
        const timerDuration = Date.now() - startTimeRef.current
        const discrepancy = Math.abs(timerDuration - finalDurationMillis)
        if (discrepancy > 2000) { // More than 2 seconds difference
          console.warn(`WARNING: Timer shows ${Math.floor(timerDuration / 1000)}s but recording is ${durationSeconds}s`)
          console.warn('This suggests recording stopped when screen was locked or app was backgrounded')
        }
      }

      await stopRecordingInternal()
      await resetAudioMode()

      // Generate meeting ID and save
      const meetingId = await Crypto.randomUUID()
      
      // CRITICAL: Verify URI exists before trying to save
      if (!uri) {
        console.error('❌ No recording URI available - cannot save meeting')
        Alert.alert(
          'Error',
          'No recording data available. The recording may not have been saved correctly.',
          [{ text: 'OK', onPress: () => onNavigate('home') }]
        )
        return
      }

      console.log('💾 [RecordingScreen] Saving recording...')
      console.log('   - URI:', uri)
      console.log('   - Duration:', durationSeconds, 'seconds')
      console.log('   - Meeting ID:', meetingId)

      let permanentUri: string
      try {
        permanentUri = await saveRecordingToPermanentLocation(uri, meetingId)
        console.log('✅ [RecordingScreen] Recording saved to:', permanentUri)
        
        // CRITICAL: Verify file exists before saving to database
        const fileInfo = await FileSystem.getInfoAsync(permanentUri)
        if (!fileInfo.exists) {
          console.error('❌ [RecordingScreen] File does not exist after save!')
          throw new Error(`File does not exist at saved location: ${permanentUri}`)
        }
        console.log('✅ [RecordingScreen] Verified file exists, size:', fileInfo.size, 'bytes')
      } catch (saveError: any) {
        console.error('❌ [RecordingScreen] Failed to save recording file:', saveError)
        Alert.alert(
          'Error Saving Recording',
          `Failed to save the recording file: ${saveError?.message || 'Unknown error'}. The recording may not be available for playback.`,
          [{ text: 'OK', onPress: () => onNavigate('home') }]
        )
        return
      }

      // Create meeting record
      const meeting = await MeetingRepository.createMeeting({
        title: `Meeting ${new Date().toLocaleDateString()}`,
        duration_sec: durationSeconds,
        local_audio_uri: permanentUri,
        status: 'recorded',
      })

      console.log('✅ [RecordingScreen] Meeting saved to database:', meeting.id)
      console.log('   - Audio URI:', meeting.local_audio_uri)

      // CRITICAL: Stop foreground service BEFORE navigation (Android)
      // This ensures the service is stopped and notification is removed
      if (Platform.OS === 'android') {
        try {
          await stopForegroundService()
          console.log('✅ Foreground service stopped after meeting saved')
        } catch (error) {
          console.warn('⚠️ Error stopping foreground service (non-critical):', error)
        }
      } else {
        try {
          await cancelRecordingNotification()
        } catch (error) {
          console.warn('⚠️ Error canceling notification (non-critical):', error)
        }
      }

      // Show completion notification
      try {
        await showRecordingStoppedNotification(meeting.title)
      } catch (error) {
        console.warn('⚠️ Error showing completion notification (non-critical):', error)
      }

      // CRITICAL: Clear all state and refs before navigation
      setDurationMillis(0)
      setIsRecording(false)
      setIsPaused(false)
      setIsBackgroundRecording(false)
      setForegroundServiceActive(false)
      setInterruptionMessage(null)
      startTimeRef.current = null
      recordingRef.current = null
      setRecording(null)

      // Small delay to ensure all cleanup is complete before navigation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Show saved toast
      setShowSavedToast(true)
      setTimeout(() => {
        setShowSavedToast(false)
        // Navigate to home after toast
        onNavigate('home')
      }, 2000)
    } catch (error) {
      console.error('❌ Error saving recording:', error)
      Alert.alert('Error', 'Failed to save recording. Please try again.')
      
      // Ensure complete cleanup on error
      await stopRecordingInternal()
      try {
        await resetAudioMode()
      } catch (resetError) {
        console.warn('⚠️ Error resetting audio mode:', resetError)
      }
      
      // Clear all state
      setDurationMillis(0)
      setIsRecording(false)
      setIsPaused(false)
      setIsBackgroundRecording(false)
      setForegroundServiceActive(false)
      setInterruptionMessage(null)
      startTimeRef.current = null
      recordingRef.current = null
      setRecording(null)
      
      // Small delay before navigation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Navigate to home
      console.log('✅ Navigating to home after error')
      onNavigate('home')
    }
  }

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Auto-start recording when screen loads
  useEffect(() => {
    if (hasPermission === true && !isRecording && !recordingRef.current) {
      startRecording()
    }
  }, [hasPermission])

  if (hasPermission === false) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>BotMR</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="mic-off" size={64} color={Colors.mutedForeground} />
          <Text style={styles.errorTitle}>Microphone Permission Required</Text>
          <Text style={styles.errorText}>
            Please enable microphone access in your device settings to record meetings.
          </Text>
          <Button onPress={() => onNavigate('home')} style={styles.backButton}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BotMR</Text>
      </View>

      {/* Interruption Message */}
      {interruptionMessage && (
        <Card style={styles.interruptionCard}>
          <View style={styles.interruptionContent}>
            <Ionicons name="alert-circle" size={20} color={Colors.orange} />
            <Text style={styles.interruptionText}>{interruptionMessage}</Text>
          </View>
        </Card>
      )}

      {/* Background Recording Indicator */}
      {isBackgroundRecording && isRecording && (
        <Card style={styles.backgroundCard}>
          <View style={styles.backgroundContent}>
            <Ionicons name="mic" size={16} color={Colors.accent} />
            <Text style={styles.backgroundText}>
              🎙️ Recording in progress. You can lock the screen safely.
            </Text>
          </View>
        </Card>
      )}

      {showBackgroundNotice && (
        <Card style={styles.noticeCard}>
          <View style={styles.noticeContent}>
            <View style={styles.noticeTextContainer}>
              <Ionicons name="information-circle" size={20} color={Colors.accent} style={styles.noticeIcon} />
              <View style={styles.noticeText}>
                <Text style={styles.noticeTitle}>
                  {Platform.OS === 'android'
                    ? 'Recording will continue even if the screen is locked'
                    : 'Recording continues in background'}
                </Text>
                <Text style={styles.noticeSubtitle}>
                  {Platform.OS === 'android'
                    ? 'A system notification will be shown. You can lock the screen safely.'
                    : 'You can minimize the app or lock your screen. Recording will continue until you stop it.'}
                </Text>
              </View>
            </View>
            <Button size="sm" onPress={() => setShowBackgroundNotice(false)} style={styles.gotItButton}>
              <Text style={styles.gotItText}>Got it</Text>
            </Button>
          </View>
        </Card>
      )}

      {/* Failed State */}
      {isFailed && (
        <Card style={styles.errorCard}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={32} color={Colors.destructive} />
            <Text style={styles.errorTitle}>Recording couldn't start</Text>
            <Text style={styles.errorSubtitle}>
              There was an error starting the recording. Please try again.
            </Text>
            <View style={styles.errorActions}>
              <Button size="lg" onPress={resetRecordingEngine} style={styles.resetButton}>
                Reset & Try Again
              </Button>
              {permissionStatus === 'denied' && (
                <Button
                  size="lg"
                  variant="outline"
                  onPress={() => Linking.openSettings()}
                  style={styles.settingsButton}
                >
                  Open Settings
                </Button>
              )}
            </View>
          </View>
        </Card>
      )}

      {/* Recording Indicator */}
      {!isFailed && (
        <View style={styles.recordingContainer}>
          {isStarting ? (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.waitingText}>Starting...</Text>
            </View>
          ) : isRecording ? (
            <>
              <View style={styles.recordingIndicator}>
                <View style={styles.pulseRing1} />
                <View style={styles.pulseRing2} />
                <View style={styles.recordCircle}>
                  <View style={styles.recordCircleInner} />
                </View>
              </View>

              {/* Timer */}
              <View style={styles.timerContainer}>
                <Text style={styles.timer}>{formatTime(durationMillis)}</Text>
                {/* Status Chip */}
                <View style={styles.statusChip}>
                  {isPaused ? (
                    <>
                      <Ionicons name="pause" size={12} color={Colors.mutedForeground} />
                      <Text style={styles.statusChipText}>Paused</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.recordingDot} />
                      <Text style={styles.statusChipText}>Recording</Text>
                    </>
                  )}
                </View>
              </View>
            </>
          ) : isStopping ? (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.waitingText}>Stopping...</Text>
            </View>
          ) : (
            <View style={styles.waitingContainer}>
              <Ionicons name="mic" size={64} color={Colors.mutedForeground} />
              <Text style={styles.waitingText}>Ready to record</Text>
            </View>
          )}
        </View>
      )}

      {/* Saved Toast */}
      {showSavedToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
            <Text style={styles.toastText}>Saved ✓</Text>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {isRecording && !isStopping && (
          <TouchableOpacity
            onPress={isPaused ? resumeRecording : pauseRecording}
            style={styles.controlButton}
            activeOpacity={0.7}
            disabled={isStopping}
          >
            <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={Colors.foreground} />
          </TouchableOpacity>
        )}

        {isRecording && !isStopping && (
          <TouchableOpacity
            onPress={stopRecording}
            style={styles.stopButton}
            activeOpacity={0.7}
            disabled={isStopping}
          >
            <Ionicons name="stop" size={32} color={Colors.destructiveForeground} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  interruptionCard: {
    marginBottom: 16,
    borderColor: Colors.orange + '4D',
    backgroundColor: Colors.orange + '0D',
    padding: 16,
  },
  interruptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  interruptionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.orange,
    fontWeight: '500',
  },
  preBackgroundCard: {
    marginBottom: 16,
    borderColor: Colors.accent + '4D',
    backgroundColor: Colors.accent + '1A',
    padding: 16,
  },
  preBackgroundContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  preBackgroundTextContainer: {
    flex: 1,
  },
  preBackgroundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 4,
  },
  preBackgroundSubtitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
    lineHeight: 18,
  },
  backgroundCard: {
    marginBottom: 16,
    borderColor: Colors.accent + '4D',
    backgroundColor: Colors.accent + '0D',
    padding: 12,
  },
  backgroundContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backgroundText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
    flex: 1,
  },
  noticeCard: {
    marginBottom: 24,
    borderColor: Colors.accent + '4D',
    backgroundColor: Colors.accent + '0D',
    padding: 16,
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  noticeTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  gotItButton: {
    height: 24,
    paddingHorizontal: 8,
  },
  gotItText: {
    fontSize: 12,
  },
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginVertical: 32,
  },
  recordingIndicator: {
    position: 'relative',
    width: 224,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing1: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: Colors.accent,
    opacity: 0.2,
  },
  pulseRing2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.accent,
    opacity: 0.3,
  },
  recordCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: Colors.accent + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCircleInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accent,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 60,
    fontWeight: '500',
    color: Colors.foreground,
    fontFamily: 'monospace',
    letterSpacing: -1,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.foreground,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  recordingText: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  errorCard: {
    marginVertical: 32,
    padding: 24,
    borderColor: Colors.destructive + '4D',
    backgroundColor: Colors.destructive + '0D',
  },
  errorContent: {
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorActions: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    width: '100%',
  },
  settingsButton: {
    width: '100%',
  },
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },
  waitingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  waitingText: {
    fontSize: 16,
    color: Colors.mutedForeground,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    width: '100%',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 48,
  },
  errorText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  backButton: {
    marginTop: 24,
  },
})
