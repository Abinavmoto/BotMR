import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, AppState, AppStateStatus, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Colors } from '@/constants/Colors'
import { MeetingRepository, Meeting } from '@/src/db/MeetingRepository'
import { deleteRecordingFile } from '@/src/services/audioService'
import * as FileSystem from 'expo-file-system/legacy'

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
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const soundRef = useRef<Audio.Sound | null>(null)

  // Keep sound ref in sync with state
  useEffect(() => {
    soundRef.current = sound
  }, [sound])

  const cleanupAudio = async () => {
    const currentSound = soundRef.current
    if (currentSound) {
      try {
        // Get current status
        const status = await currentSound.getStatusAsync()
        
        // Stop if playing
        if (status.isLoaded && status.isPlaying) {
          await currentSound.stopAsync()
          setIsPlaying(false)
        }
        
        // Then unload
        await currentSound.unloadAsync()
      } catch (error) {
        console.warn('Error cleaning up audio:', error)
      } finally {
        setSound(null)
        setIsPlaying(false)
        setPlaybackPosition(0)
        soundRef.current = null
      }
    }
  }

  useEffect(() => {
    loadMeeting()
    
    // CRITICAL: Update app state ref when component mounts
    // This ensures the ref is current when user navigates to this screen
    appStateRef.current = AppState.currentState
    
    return () => {
      // Await cleanup to ensure audio is stopped before component unmounts
      cleanupAudio().catch((error) => {
        console.warn('Error in cleanup on unmount:', error)
      })
    }
  }, [meetingId])

  // Load sound when meeting is loaded (only if duration > 0)
  useEffect(() => {
    if (meeting && meeting.local_audio_uri && meeting.duration_sec > 0) {
      loadSound()
    } else if (meeting && meeting.duration_sec === 0) {
      setAudioError('No audio recorded. This meeting has 0 seconds duration.')
    }
  }, [meeting])

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
      if (loadedMeeting) {
        setEditedTitle(loadedMeeting.title)
      }
    } catch (error) {
      console.error('Error loading meeting:', error)
    }
  }

  const handleEditTitle = () => {
    if (meeting) {
      setEditedTitle(meeting.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitle = async () => {
    if (!meeting || !editedTitle.trim()) {
      Alert.alert('Error', 'Title cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const updated = await MeetingRepository.updateMeeting(meeting.id, {
        title: editedTitle.trim(),
      })
      if (updated) {
        setMeeting(updated)
        setIsEditingTitle(false)
      } else {
        Alert.alert('Error', 'Failed to update meeting title')
      }
    } catch (error) {
      console.error('Error updating meeting title:', error)
      Alert.alert('Error', 'Failed to update meeting title')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (meeting) {
      setEditedTitle(meeting.title)
    }
    setIsEditingTitle(false)
  }

  const handleDeleteMeeting = () => {
    if (!meeting) return

    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete audio file
              await deleteRecordingFile(meeting.local_audio_uri)
              
              // Delete from database
              const deleted = await MeetingRepository.deleteMeeting(meeting.id)
              
              if (deleted) {
                // Clean up audio before navigating
                await cleanupAudio()
                // Navigate back to home
                onNavigate('home')
              } else {
                Alert.alert('Error', 'Failed to delete meeting')
              }
            } catch (error) {
              console.error('Error deleting meeting:', error)
              Alert.alert('Error', 'Failed to delete meeting')
            }
          },
        },
      ],
    )
  }

  const loadSound = async () => {
    if (!meeting) return

    try {
      // Clear any previous error
      setAudioError(null)

      console.log('🔊 [MeetingDetail] Loading audio...')
      console.log('   - URI from database:', meeting.local_audio_uri)

      // Normalize URI - FileSystem paths might already have file:// prefix
      let normalizedUri = meeting.local_audio_uri.trim()
      
      // Remove any duplicate file:// prefixes
      while (normalizedUri.startsWith('file://')) {
        normalizedUri = normalizedUri.substring(7)
      }
      
      // Ensure we have a proper file:// URI
      if (!normalizedUri.startsWith('file://') && !normalizedUri.startsWith('http://') && !normalizedUri.startsWith('https://')) {
        // Add file:// prefix
        normalizedUri = `file://${normalizedUri}`
      }

      console.log('   - Normalized URI:', normalizedUri)

      // Check if file exists before trying to load
      // CRITICAL: expo-av on Android has a known issue with file:///data/... paths
      // It strips /data from the path, looking for /user/0/... instead
      // We need to use the path format that expo-av actually expects
      
      // Try both the original URI and normalized URI
      let fileInfo = null
      let finalUri = normalizedUri
      let actualFilePath: string | null = null
      let fileSystemPath: string | null = null
      
      try {
        fileInfo = await FileSystem.getInfoAsync(meeting.local_audio_uri)
        if (fileInfo.exists) {
          finalUri = meeting.local_audio_uri
          actualFilePath = meeting.local_audio_uri
          // Get the path without file:// prefix for FileSystem operations
          fileSystemPath = meeting.local_audio_uri.replace(/^file:\/\/+/, '')
          console.log('✅ [MeetingDetail] File exists at original URI')
          console.log('   - FileSystem path (no prefix):', fileSystemPath)
        }
      } catch (e) {
        console.warn('⚠️ [MeetingDetail] Could not check original URI, trying normalized:', e)
      }
      
      if (!fileInfo || !fileInfo.exists) {
        try {
          // Remove file:// to check with FileSystem
          const checkUri = normalizedUri.startsWith('file://') ? normalizedUri.substring(7) : normalizedUri
          fileInfo = await FileSystem.getInfoAsync(checkUri)
          if (fileInfo.exists) {
            finalUri = normalizedUri
            actualFilePath = normalizedUri
            fileSystemPath = checkUri
            console.log('✅ [MeetingDetail] File exists at normalized URI')
            console.log('   - FileSystem path (no prefix):', fileSystemPath)
          }
        } catch (e) {
          console.warn('⚠️ [MeetingDetail] Could not check normalized URI:', e)
        }
      }
      
      // Use the FileSystem path (without file:// prefix) as the base
      // This is the actual path that FileSystem uses and expo-av might need
      if (fileSystemPath && fileInfo?.exists) {
        console.log('   - Using FileSystem path as base:', fileSystemPath)
        finalUri = fileSystemPath // Use path without prefix
      }

      if (!fileInfo || !fileInfo.exists) {
        const errorMsg = `Audio file not found: ${meeting.local_audio_uri}`
        console.error('❌ [MeetingDetail]', errorMsg)
        console.error('   - Tried original URI:', meeting.local_audio_uri)
        console.error('   - Tried normalized URI:', normalizedUri)
        setAudioError('Audio file not found. The recording may not have been saved correctly.')
        return
      }

      console.log('✅ [MeetingDetail] File exists, size:', fileInfo.size, 'bytes')
      console.log('   - FileSystem path (verified):', fileSystemPath)
      console.log('   - Final URI to use:', finalUri)

      if (sound) {
        await sound.unloadAsync()
      }

      // CRITICAL: expo-av on Android has a bug where it strips /data from file:///data/... paths
      // The error shows it's looking for /user/0/... instead of /data/user/0/...
      // We need to try multiple formats to work around this bug
      
      // Use the FileSystem path (without file:// prefix) as the base
      // This is the actual path that FileSystem verified exists
      const basePath = fileSystemPath || finalUri.replace(/^file:\/\/+/, '')
      
      console.log('   - Base path (from FileSystem):', basePath)
      
      // According to Expo documentation, file:/// (three slashes) is correct for absolute paths
      // Try formats in order of preference:
      // 1. Original URI as-is (file:///data/...) - this is the correct format
      // 2. Absolute path without prefix (/data/...)
      // 3. file:// (two slashes) - but this might not work for absolute paths
      
      // Build URI formats to try
      // CRITICAL: expo-av on Android has a bug where it strips /data from file:///data/... paths
      // Error shows it's looking for /user/0/... instead of /data/user/0/...
      // We need to try multiple formats to work around this
      const uriFormats: Array<{ name: string; uri: string }> = []
      
      // Priority 1: Absolute path without any prefix (most likely to work)
      // expo-av might handle absolute paths better than file:// URIs
      if (basePath && basePath.startsWith('/')) {
        uriFormats.push({ name: 'Absolute path (no prefix)', uri: basePath })
        console.log('   - Trying absolute path first:', basePath)
      }
      
      // Priority 2: FileSystem path with file:// prefix (two slashes)
      if (basePath && basePath.startsWith('/')) {
        const twoSlashUri = `file://${basePath}`
        uriFormats.push({ name: 'file:// (two slashes)', uri: twoSlashUri })
      }
      
      // Priority 3: Original URI from database (file:///data/...)
      // This is the "correct" format but expo-av has a bug with it
      uriFormats.push({ name: 'Original (file:///data/...)', uri: finalUri })
      
      // Priority 4: Try with file:/// prefix (three slashes)
      if (basePath && basePath.startsWith('/')) {
        const threeSlashUri = `file:///${basePath}`
        if (!uriFormats.some(f => f.uri === threeSlashUri)) {
          uriFormats.push({ name: 'file:/// (three slashes)', uri: threeSlashUri })
        }
      }
      
      // Priority 5: Workaround - try path without /data (expo-av bug workaround)
      // expo-av might be stripping /data, so try the path it's actually looking for
      if (basePath && basePath.startsWith('/data/')) {
        const withoutData = basePath.replace(/^\/data/, '')
        if (withoutData !== basePath) {
          uriFormats.push({ name: 'Workaround: /user/0/... (no /data)', uri: withoutData })
          uriFormats.push({ name: 'Workaround: file:///user/0/...', uri: `file://${withoutData}` })
        }
      }
      
      console.log('   - Will try', uriFormats.length, 'URI formats:', uriFormats.map(f => f.name))

      // Try creating sound with multiple URI formats
      let newSound: Audio.Sound | null = null
      let lastError: any = null
      let successfulFormat: string | null = null
      
      for (const format of uriFormats) {
        try {
          console.log(`   - Trying ${format.name}:`, format.uri.substring(0, 60) + '...')
          const result = await Audio.Sound.createAsync(
            { uri: format.uri },
            {
              shouldPlay: false,
              isMuted: false,
              volume: 1.0,
            },
          )
          newSound = result.sound
          successfulFormat = format.name
          console.log(`✅ [MeetingDetail] Audio loaded successfully with ${format.name}`)
          break // Success, stop trying
        } catch (error: any) {
          lastError = error
          console.warn(`⚠️ [MeetingDetail] Failed with ${format.name}:`, error?.message?.substring(0, 100))
          // Continue to next format
        }
      }
      
      if (!newSound) {
        console.error('❌ [MeetingDetail] All URI formats failed')
        console.error('   - Tried formats:', uriFormats.map(f => f.name).join(', '))
        console.error('   - Last error:', lastError?.message)
        throw lastError || new Error('Failed to create audio sound with all URI formats')
      }
      
      console.log(`✅ [MeetingDetail] Successfully loaded audio using: ${successfulFormat}`)

      setSound(newSound)
      setAudioError(null) // Clear error on success
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      console.error('❌ [MeetingDetail] Error loading audio:', error)
      console.error('   - URI:', meeting.local_audio_uri)
      console.error('   - Error message:', errorMessage)
      
      // Provide user-friendly error message
      if (errorMessage.includes('FileDataSourceException') || errorMessage.includes('not found')) {
        setAudioError('Audio file not found. The recording may not have been saved correctly.')
      } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        setAudioError('Permission denied. Please check app permissions.')
      } else {
        setAudioError(`Failed to load audio: ${errorMessage}`)
      }
    }
  }

  const playPause = async () => {
    // Don't allow playback if there's an error or no sound
    if (audioError || !sound) {
      if (!sound && meeting && meeting.local_audio_uri) {
        // Try to load sound first
        await loadSound()
        // Wait a moment for sound to load
        await new Promise(resolve => setTimeout(resolve, 200))
        if (!sound || audioError) {
          return // Still can't load
        }
      } else {
        return // Can't play
      }
    }

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
          // Get current sound from ref (updated by loadSound)
          const currentSound = soundRef.current
          if (AppState.currentState === 'active' && currentSound && !audioError) {
            if (typeof currentSound.playAsync === 'function') {
              await currentSound.playAsync()
            }
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

  const handleBack = async () => {
    await cleanupAudio()
    onNavigate('home')
  }

  if (!meeting) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Button variant="ghost" size="icon" onPress={handleBack}>
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
        <Button variant="ghost" size="icon" onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
        </Button>
        <Text style={styles.headerTitle}>Meeting Details</Text>
        <Button variant="ghost" size="icon" onPress={handleDeleteMeeting}>
          <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
        </Button>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Meeting Info */}
        <Card style={styles.infoCard}>
          <View style={styles.titleContainer}>
            {isEditingTitle ? (
              <View style={styles.editTitleContainer}>
                <Input
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  style={styles.titleInput}
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onPress={handleSaveTitle}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.titleRow}>
                <Text style={styles.title}>{meeting.title}</Text>
                <Button variant="ghost" size="icon-sm" onPress={handleEditTitle}>
                  <Ionicons name="pencil-outline" size={16} color={Colors.foreground} />
                </Button>
              </View>
            )}
          </View>
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

          {audioError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={32} color={Colors.destructive} />
              <Text style={styles.errorText}>{audioError}</Text>
              <Button size="sm" variant="outline" onPress={loadSound} style={styles.retryButton}>
                <Ionicons name="refresh" size={16} color={Colors.foreground} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </Button>
            </View>
          ) : (
            <>
              <View style={styles.playerControls}>
                <Button 
                  size="lg" 
                  onPress={playPause} 
                  style={styles.playButton}
                  disabled={!sound || audioError !== null}
                >
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
            </>
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
  titleContainer: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  editTitleContainer: {
    gap: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '500',
    height: 44,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
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
  errorContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.destructive,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    color: Colors.foreground,
  },
})
