// New audio service using expo-audio (replaces expo-av)
import * as FileSystem from 'expo-file-system/legacy'
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
  useAudioPlayer,
  AudioPlayer,
} from 'expo-audio'

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/'

/**
 * Configure audio mode for background recording using expo-audio.
 */
export async function configureAudioModeForRecordingV2(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      staysActiveInBackground: true, // Critical for background recording
    })
    
    // Small delay to ensure audio session is fully activated
    await new Promise(resolve => setTimeout(resolve, 150))
  } catch (error) {
    console.error('Error configuring audio mode:', error)
    throw error
  }
}

/**
 * Reset audio mode to safe defaults after recording stops.
 */
export async function resetAudioModeV2(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      allowsRecording: false,
      staysActiveInBackground: false,
    })
  } catch (error) {
    console.error('Error resetting audio mode:', error)
  }
}

/**
 * Request microphone permissions.
 */
export async function requestRecordingPermissions(): Promise<boolean> {
  try {
    const status = await AudioModule.requestRecordingPermissionsAsync()
    return status.granted
  } catch (error) {
    console.error('Error requesting recording permissions:', error)
    return false
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
