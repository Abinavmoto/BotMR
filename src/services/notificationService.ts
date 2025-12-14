// Background notification service for recording status
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true, // Use new API
    shouldShowList: true, // Use new API
    shouldPlaySound: false, // Don't play sound during recording
    shouldSetBadge: false,
  }),
})

/**
 * Request notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // CRITICAL: Use HIGH importance for foreground service notification
      // This ensures the notification is always visible during background recording
      await Notifications.setNotificationChannelAsync('recording', {
        name: 'Recording Status',
        importance: Notifications.AndroidImportance.HIGH, // HIGH for foreground service
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
        showBadge: false,
        sound: null, // No sound during recording
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    return finalStatus === 'granted'
  } catch (error) {
    console.error('Error requesting notification permissions:', error)
    return false
  }
}

/**
 * Show foreground service notification for Android background recording.
 * This is REQUIRED for background recording on Android - the notification must be visible.
 * 
 * Returns notification ID if successful, null if failed.
 * If this fails, recording should NOT continue in background.
 */
export async function showRecordingNotification(durationSeconds: number): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      console.error('❌ Notification permission denied - cannot show foreground service notification')
      return null
    }

    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    // Android: Foreground service notification (required for background recording)
    // iOS: Regular notification (informational)
    const notificationContent = Platform.OS === 'android' 
      ? {
          title: '🎙️ BotMR is recording audio',
          body: `Tap to return — ${timeString}`,
          data: { type: 'recording', foregroundService: true },
          // Android-specific: Make it sticky and non-dismissible
          sticky: true,
        }
      : {
          title: 'Recording in Progress',
          body: `BotMR is recording (${timeString})`,
          data: { type: 'recording' },
        }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Show immediately
      identifier: 'recording-status',
    })

    if (Platform.OS === 'android') {
      console.log('✅ Foreground service notification shown - background recording enabled')
    }

    return notificationId
  } catch (error) {
    console.error('❌ Error showing recording notification:', error)
    return null
  }
}

/**
 * Update existing recording notification with new duration.
 * Uses a more efficient approach to avoid canceling/recreating notifications.
 * 
 * CRITICAL: On Android, this maintains the foreground service notification.
 */
export async function updateRecordingNotification(durationSeconds: number): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      console.warn('⚠️ Notification permission lost - cannot update foreground service notification')
      return
    }

    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    const notificationContent = Platform.OS === 'android'
      ? {
          title: '🎙️ BotMR is recording audio',
          body: `Tap to return — ${timeString}`,
          data: { type: 'recording', foregroundService: true },
          sticky: true,
        }
      : {
          title: 'Recording in Progress',
          body: `BotMR is recording (${timeString})`,
          data: { type: 'recording' },
        }

    // Use setNotificationAsync to update existing notification efficiently
    await Notifications.setNotificationAsync('recording-status', {
      content: notificationContent,
      trigger: null,
    })
  } catch (error) {
    // If setNotificationAsync fails, fall back to cancel + create
    try {
      await Notifications.cancelScheduledNotificationAsync('recording-status')
      await showRecordingNotification(durationSeconds)
    } catch (fallbackError) {
      console.error('Error updating recording notification:', fallbackError)
    }
  }
}

/**
 * Cancel recording notification.
 */
export async function cancelRecordingNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('recording-status')
    await Notifications.dismissNotificationAsync('recording-status')
  } catch (error) {
    console.error('Error canceling recording notification:', error)
  }
}

/**
 * Show notification when recording is stopped/saved.
 */
export async function showRecordingStoppedNotification(message: string): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      return
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.includes('started') ? 'Recording Started' : 'Recording Saved',
        body: message.includes('started') ? 'BotMR is now recording' : message,
        data: { type: message.includes('started') ? 'recording-started' : 'recording-stopped' },
      },
      trigger: null,
    })
  } catch (error) {
    console.error('Error showing recording notification:', error)
  }
}
