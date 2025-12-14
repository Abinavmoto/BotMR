// Use legacy API for compatibility (expo-file-system SDK 54 migration)
import * as FileSystem from 'expo-file-system/legacy'
import { Audio } from 'expo-av'

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/'

/**
 * Configure audio mode for background recording.
 * 
 * IMPORTANT NOTES ON BACKGROUND RECORDING:
 * - On iOS, recording can continue in background while the app session remains alive
 * - If the OS terminates the app (e.g., low memory, user force-quit), recording stops
 * - Expo Go has limitations: background recording may not work as reliably as dev/production builds
 * - For production, consider using expo-dev-client or EAS Build for better background support
 * - iOS requires proper audio session configuration for background recording
 * 
 * This function sets up the audio mode defensively before recording starts.
 */
export async function configureAudioModeForRecording(): Promise<void> {
  try {
    // CRITICAL: Verify permissions before configuring audio mode
    try {
      const { status } = await Audio.getPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted. Cannot configure audio mode.')
      }
    } catch (permError) {
      console.error('Permission check failed:', permError)
      throw new Error('Cannot verify microphone permission')
    }

    // First, reset any existing audio session to avoid conflicts
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      })
      // Longer delay to ensure session is fully reset
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (resetError) {
      // Ignore reset errors - session might not be active
      console.warn('Audio session reset warning (non-critical):', resetError)
    }

    // Configure audio mode for background recording
    // Android and iOS specific settings for reliable background recording
    try {
      const audioModeConfig: any = {
        // iOS-specific settings - CRITICAL for background recording
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true, // Critical for background recording
        
        // Android-specific settings - CRITICAL for background recording
        shouldDuckAndroid: false, // Don't duck other audio
        // interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix
        // Note: Using numeric value as enum may not be available
      }
      
      // Try to set Android interruption mode (may not be available in all versions)
      try {
        if (Audio.InterruptionModeAndroid) {
          audioModeConfig.interruptionModeAndroid = Audio.InterruptionModeAndroid.DoNotMix
        } else {
          // Fallback: use numeric value (1 = DoNotMix)
          audioModeConfig.interruptionModeAndroid = 1
        }
      } catch {
        // Enum not available, skip
      }
      
      await Audio.setAudioModeAsync(audioModeConfig)
    } catch (configError) {
      console.error('Error setting audio mode:', configError)
      // Try minimal configuration as fallback
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        })
        console.log('Using minimal audio mode configuration (background recording may be limited)')
      } catch (fallbackError) {
        console.error('Fallback audio mode also failed:', fallbackError)
        throw new Error(`Failed to configure audio mode: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
      }
    }
    
    // Longer delay to ensure audio session is fully activated
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Verify audio mode was set correctly
    try {
      // Note: There's no getAudioModeAsync, so we can't verify, but the delay should be sufficient
      console.log('Audio mode configured successfully for recording')
    } catch (verifyError) {
      console.warn('Could not verify audio mode (non-critical):', verifyError)
    }
  } catch (error) {
    console.error('Error configuring audio mode:', error)
    // If configuration fails, throw to prevent recording with wrong settings
    throw error
  }
}

/**
 * Reset audio mode to safe defaults after recording stops.
 * This prevents audio session conflicts with other apps.
 */
export async function resetAudioMode(): Promise<void> {
  try {
    // Reset to safe defaults - only essential parameters
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    })
  } catch (error) {
    console.error('Error resetting audio mode:', error)
    // Non-critical - audio mode will reset when app closes anyway
  }
}

export async function ensureRecordingsDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true })
  }
}

export async function getRecordingPath(meetingId: string): Promise<string> {
  await ensureRecordingsDirectory()
  return `${RECORDINGS_DIR}${meetingId}.m4a`
}

export async function saveRecordingToPermanentLocation(
  tempUri: string,
  meetingId: string,
): Promise<string> {
  try {
    await ensureRecordingsDirectory()
    const permanentPath = await getRecordingPath(meetingId)

    // Check if temp file exists
    const tempInfo = await FileSystem.getInfoAsync(tempUri)
    if (!tempInfo.exists) {
      throw new Error('Temporary recording file not found')
    }

    // Move file to permanent location
    await FileSystem.moveAsync({
      from: tempUri,
      to: permanentPath,
    })

    return permanentPath
  } catch (error) {
    console.error('Error saving recording:', error)
    // If move fails, return temp URI as fallback
    return tempUri
  }
}

export async function deleteRecordingFile(uri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri)
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true })
    }
  } catch (error) {
    console.error('Error deleting recording file:', error)
  }
}
