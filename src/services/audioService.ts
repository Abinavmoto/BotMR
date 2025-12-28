// Use legacy API for compatibility (expo-file-system SDK 54 migration)
import * as FileSystem from 'expo-file-system/legacy'
import { Audio } from 'expo-av'

// Use documentDirectory as-is - FileSystem operations handle the file:// prefix automatically
const RECORDINGS_DIR = (FileSystem.documentDirectory || '') + 'recordings/'

// Log the directory format on module load
console.log('📁 [AudioService] Document directory:', FileSystem.documentDirectory)
console.log('📁 [AudioService] Recordings directory:', RECORDINGS_DIR)

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
  try {
    console.log('📁 [AudioService] Ensuring recordings directory exists...')
    console.log('   - Path:', RECORDINGS_DIR)
    
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR)
    console.log('   - Directory exists:', dirInfo.exists)
    
    if (!dirInfo.exists) {
      console.log('   - Creating directory...')
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true })
      
      // Verify it was created
      const verifyInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR)
      if (!verifyInfo.exists) {
        throw new Error(`Failed to create recordings directory: ${RECORDINGS_DIR}`)
      }
      console.log('✅ [AudioService] Directory created successfully')
    } else {
      console.log('✅ [AudioService] Directory already exists')
    }
  } catch (error) {
    console.error('❌ [AudioService] Error ensuring recordings directory:', error)
    throw error
  }
}

export async function getRecordingPath(meetingId: string): Promise<string> {
  await ensureRecordingsDirectory()
  const path = `${RECORDINGS_DIR}${meetingId}.m4a`
  
  // Log the path format for debugging
  console.log('📁 [AudioService] Generated recording path:', path)
  console.log('   - documentDirectory:', FileSystem.documentDirectory)
  console.log('   - RECORDINGS_DIR:', RECORDINGS_DIR)
  console.log('   - Full path:', path)
  
  // Return path as-is (FileSystem operations handle file:// prefix)
  return path
}

export async function saveRecordingToPermanentLocation(
  tempUri: string,
  meetingId: string,
): Promise<string> {
  try {
    await ensureRecordingsDirectory()
    const permanentPath = await getRecordingPath(meetingId)

    console.log('📁 [AudioService] Saving recording to permanent location...')
    console.log('   - Temp URI:', tempUri)
    console.log('   - Permanent path:', permanentPath)
    console.log('   - Meeting ID:', meetingId)

    // Check if temp file exists
    const tempInfo = await FileSystem.getInfoAsync(tempUri)
    if (!tempInfo.exists) {
      console.error('❌ [AudioService] Temporary recording file not found:', tempUri)
      throw new Error(`Temporary recording file not found: ${tempUri}`)
    }

    console.log('✅ [AudioService] Temp file exists, size:', tempInfo.size, 'bytes')

    // Move file to permanent location
    await FileSystem.moveAsync({
      from: tempUri,
      to: permanentPath,
    })

    console.log('✅ [AudioService] File moved to permanent location')

    // CRITICAL: Verify file exists at permanent location
    const permanentInfo = await FileSystem.getInfoAsync(permanentPath)
    if (!permanentInfo.exists) {
      console.error('❌ [AudioService] File does not exist at permanent location after move!')
      throw new Error(`File does not exist at permanent location: ${permanentPath}`)
    }

    console.log('✅ [AudioService] Verified file exists at permanent location, size:', permanentInfo.size, 'bytes')
    console.log('✅ [AudioService] File saved successfully:', permanentPath)
    
    // Return path as-is - FileSystem.documentDirectory already includes file:// prefix
    // The path should already be in the correct format for Audio.Sound.createAsync
    console.log('✅ [AudioService] Returning path:', permanentPath)
    return permanentPath
  } catch (error) {
    console.error('❌ [AudioService] Error saving recording:', error)
    // Don't return temp URI as fallback - it might not exist
    // Throw error so caller knows file wasn't saved
    throw error
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
