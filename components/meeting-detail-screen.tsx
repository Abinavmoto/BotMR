import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, AppState, AppStateStatus } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Colors } from '@/constants/Colors'
import { MeetingRepository, Meeting } from '@/src/db/MeetingRepository'

import { NavigationHandler } from '@/src/types/navigation'

interface MeetingDetailScreenProps {
  meetingId: string
  onNavigate: NavigationHandler
}

export function MeetingDetailScreen({ meetingId, onNavigate }: MeetingDetailScreenProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    loadMeeting()
    
    // CRITICAL: Update app state ref when component mounts
    // This ensures the ref is current when user navigates to this screen
    appStateRef.current = AppState.currentState
    
    return () => {
      if (sound) {
        sound.unloadAsync().catch((error) => {
          console.warn('Error unloading sound on cleanup:', error)
        })
      }
    }
  }, [meetingId])

  // Track app state changes separately to handle background audio pause
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState
      
      // If app goes to background while playing, pause playback
      if (nextAppState.match(/inactive|background/) && isPlaying && sound) {
        sound.pauseAsync().catch((error: any) => {
          // Suppress errors when pausing due to backgrounding
          const errorMessage = error?.message || ''
          if (!errorMessage.includes('AudioFocusNotAcquiredException')) {
            console.warn('Error pausing audio when app backgrounded:', error)
          }
        })
      }
    })
    
    return () => {
      subscription.remove()
    }
  }, [isPlaying, sound])

  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis || 0)
          setDuration(status.durationMillis || 0)
          setIsPlaying(status.isPlaying)
          if (status.didJustFinish) {
            setIsPlaying(false)
            setPlaybackPosition(0)
          }
        }
      })
    }
  }, [sound])

  const loadMeeting = async () => {
    try {
      const loadedMeeting = await MeetingRepository.getMeetingById(meetingId)
      setMeeting(loadedMeeting)
    } catch (error) {
      console.error('Error loading meeting:', error)
    }
  }

  const loadSound = async () => {
    if (!meeting) return

    try {
      if (sound) {
        await sound.unloadAsync()
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: meeting.local_audio_uri },
        {
          shouldPlay: false,
          // Ensure audio plays through speakers, not just earpiece
          playsInSilentModeIOS: true,
          isMuted: false,
          volume: 1.0,
        },
      )

      setSound(newSound)
    } catch (error) {
      console.error('Error loading audio:', error)
    }
  }

  const playPause = async () => {
    // CRITICAL: Always check current state, not cached ref
    // The ref might be stale if user just navigated to this screen
    const currentAppState = AppState.currentState
    const cachedState = appStateRef.current
    
    // Update ref with current state
    appStateRef.current = currentAppState
    
    // Only block if app is definitely backgrounded
    // Allow if app is active or inactive (inactive is OK for foreground playback)
    if (currentAppState === 'background') {
      Alert.alert(
        'App in Background',
        'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
        [{ text: 'OK' }]
      )
      return
    }
    
    // If state is 'inactive', it might be a false positive (e.g., during navigation)
    // Try to proceed but check again right before playback

    if (!sound) {
      await loadSound()
      // Wait a moment for sound to load, then play
      setTimeout(async () => {
        try {
          // Double-check app state before playing
          if (AppState.currentState === 'active' && sound) {
            await sound.playAsync()
          } else {
            console.warn('App is not active, cannot play audio')
            Alert.alert(
              'App in Background',
              'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
              [{ text: 'OK' }]
            )
          }
        } catch (error) {
          console.error('Error playing audio after load:', error)
          handlePlaybackError(error)
        }
      }, 100)
      return
    }

    try {
      // CRITICAL: Check current state (not cached) - only block if backgrounded
      const currentState = AppState.currentState
      
      // Only block if definitely backgrounded
      if (currentState === 'background') {
        Alert.alert(
          'App in Background',
          'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
          [{ text: 'OK' }]
        )
        return
      }
      
      // If inactive, wait a moment and check again (might be transitioning)
      if (currentState === 'inactive') {
        await new Promise(resolve => setTimeout(resolve, 200))
        const recheckState = AppState.currentState
        if (recheckState === 'background') {
          Alert.alert(
            'App in Background',
            'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
            [{ text: 'OK' }]
          )
          return
        }
        // If now active, proceed
      }

      // Ensure audio mode is set for playback (only if not currently recording)
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        })
        // Small delay to ensure audio mode is set
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (audioModeError) {
        console.warn('Error setting audio mode for playback (non-critical):', audioModeError)
        // Continue anyway - playback might still work
      }

      if (isPlaying) {
        await sound.pauseAsync()
      } else {
        // Final check before playing - only block if backgrounded
        const finalState = AppState.currentState
        if (finalState === 'background') {
          console.warn('App is in background, cannot play audio')
          Alert.alert(
            'App in Background',
            'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
            [{ text: 'OK' }]
          )
          return
        }
        
        // Proceed with playback (active or inactive is OK)
        await sound.playAsync()
      }
    } catch (error: any) {
      // Suppress AudioFocusNotAcquiredException - it's expected when backgrounded
      const errorMessage = error?.message || ''
      if (errorMessage.includes('AudioFocusNotAcquiredException') || 
          errorMessage.includes('background')) {
        console.warn('Audio focus not available (app may be backgrounded) - ignoring error')
        // Don't show alert - user might have backgrounded intentionally
        return
      }
      console.error('Error playing/pausing audio:', error)
      handlePlaybackError(error)
    }
  }

  const handlePlaybackError = (error: any) => {
    const errorMessage = error?.message || 'Unknown error'
    
    // Check for specific error types
    if (errorMessage.includes('AudioFocusNotAcquiredException') || 
        errorMessage.includes('background')) {
      Alert.alert(
        'App in Background',
        'Audio playback requires the app to be in the foreground. Please bring the app to the foreground to play audio.',
        [{ text: 'OK' }]
      )
    } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      Alert.alert(
        'Permission Error',
        'Audio playback permission is required. Please check your app permissions in Settings.',
        [{ text: 'OK' }]
      )
    } else {
      Alert.alert(
        'Playback Error',
        'Failed to play audio. Please try again. If the problem persists, restart the app.',
        [{ text: 'OK' }]
      )
    }
  }

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (!meeting) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Button variant="ghost" size="icon" onPress={() => onNavigate('home')}>
            <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
          </Button>
          <Text style={styles.headerTitle}>Meeting Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Card>
          <Text style={styles.loadingText}>Loading meeting...</Text>
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
        </Button>
        <Text style={styles.headerTitle}>Meeting Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Meeting Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.title}>{meeting.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.mutedForeground} />
              <Text style={styles.metaText}>
                {meeting.duration_sec >= 60
                  ? `${Math.floor(meeting.duration_sec / 60)} min`
                  : `${meeting.duration_sec} sec`}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.mutedForeground} />
              <Text style={styles.metaText}>{formatDate(meeting.created_at)}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{meeting.status}</Text>
          </View>
        </Card>

        {/* Audio Player */}
        <Card style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Ionicons name="musical-notes-outline" size={20} color={Colors.foreground} />
            <Text style={styles.playerTitle}>Audio Recording</Text>
          </View>

          <View style={styles.playerControls}>
            <Button size="lg" onPress={playPause} style={styles.playButton}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color={Colors.primaryForeground}
              />
            </Button>
          </View>

          {duration > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(playbackPosition / duration) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          )}
        </Card>

        {/* Debug Info */}
        <Card style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>ID: {meeting.id}</Text>
          <Text style={styles.debugText}>Audio URI: {meeting.local_audio_uri}</Text>
        </Card>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.foreground,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  infoCard: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.accent + '1A',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.accent,
    textTransform: 'capitalize',
  },
  playerCard: {
    padding: 20,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
  },
  playerControls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    color: Colors.mutedForeground,
    fontFamily: 'monospace',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.muted + '40',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  debugCard: {
    padding: 16,
    backgroundColor: Colors.card + '80',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.mutedForeground,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  debugText: {
    fontSize: 11,
    color: Colors.mutedForeground,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    padding: 16,
  },
})
