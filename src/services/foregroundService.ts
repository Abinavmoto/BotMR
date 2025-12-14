/**
 * Foreground Service for Android Background Recording
 * Uses @notifee/react-native to properly register a foreground service
 * This is the "missing piece" for reliable background recording on Android
 */

import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native'
import { Platform } from 'react-native'

const FOREGROUND_SERVICE_CHANNEL_ID = 'recording-foreground-service'
const NOTIFICATION_ID = 'recording-status'

// Track if foreground service is registered
let isServiceRegistered = false

/**
 * Register the foreground service handler
 * This MUST be called before using asForegroundService: true
 * Call this once when the app starts (e.g., in App.tsx or recording screen mount)
 */
export function registerForegroundServiceHandler(): void {
  if (Platform.OS !== 'android' || isServiceRegistered) {
    return
  }

  try {
    // Register the foreground service handler
    // The promise should not resolve until the service is done
    notifee.registerForegroundService((notification) => {
      return new Promise(() => {
        // This promise never resolves, keeping the service alive
        // The service will be stopped when stopForegroundService() is called
        console.log('✅ Foreground service handler registered and running')
      })
    })
    
    isServiceRegistered = true
    console.log('✅ Foreground service handler registered')
  } catch (error) {
    console.error('❌ Error registering foreground service handler:', error)
  }
}

/**
 * Create notification channel for foreground service
 * Must be called before starting the foreground service
 */
export async function createForegroundServiceChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    await notifee.createChannel({
      id: FOREGROUND_SERVICE_CHANNEL_ID,
      name: 'Recording Status',
      importance: AndroidImportance.HIGH, // Required for foreground service
      sound: undefined, // No sound during recording
      vibration: false,
      lights: false,
    })
    console.log('✅ Foreground service channel created')
  } catch (error) {
    console.error('❌ Error creating foreground service channel:', error)
    throw error
  }
}

/**
 * Start foreground service with notification
 * This is REQUIRED for background recording on Android
 * 
 * @param durationSeconds Current recording duration in seconds
 * @returns true if service started successfully, false otherwise
 */
export async function startForegroundService(durationSeconds: number): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true // iOS doesn't need foreground service
  }

  try {
    // CRITICAL: Register the foreground service handler if not already registered
    if (!isServiceRegistered) {
      registerForegroundServiceHandler()
      // Small delay to ensure registration is complete
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Ensure channel exists
    await createForegroundServiceChannel()

    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    // Start foreground service with notification
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: '🎙️ BotMR is recording audio',
      body: `Tap to return — ${timeString}`,
      android: {
        channelId: FOREGROUND_SERVICE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.SERVICE,
        // CRITICAL: This makes it a foreground service
        asForegroundService: true,
        ongoing: true, // Makes notification non-dismissible
        autoCancel: false,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        // Foreground service type for microphone
        foregroundServiceType: 'microphone',
      },
    })

    console.log('✅ Foreground service started successfully')
    return true
  } catch (error) {
    console.error('❌ Error starting foreground service:', error)
    return false
  }
}

/**
 * Update foreground service notification with new duration
 * 
 * @param durationSeconds Current recording duration in seconds
 */
export async function updateForegroundService(durationSeconds: number): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: '🎙️ BotMR is recording audio',
      body: `Tap to return — ${timeString}`,
      android: {
        channelId: FOREGROUND_SERVICE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.SERVICE,
        asForegroundService: true,
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        foregroundServiceType: 'microphone',
      },
    })
  } catch (error) {
    console.error('❌ Error updating foreground service:', error)
  }
}

/**
 * Stop foreground service and cancel notification
 */
export async function stopForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    // Stop foreground service
    await notifee.stopForegroundService()
    
    // Cancel notification
    await notifee.cancelNotification(NOTIFICATION_ID)
    
    console.log('✅ Foreground service stopped')
  } catch (error) {
    console.error('❌ Error stopping foreground service:', error)
    // Try to cancel notification even if stopForegroundService fails
    try {
      await notifee.cancelNotification(NOTIFICATION_ID)
    } catch (cancelError) {
      console.error('❌ Error canceling notification:', cancelError)
    }
  }
}

/**
 * Check if foreground service is currently active
 */
export async function isForegroundServiceActive(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false
  }

  try {
    const notifications = await notifee.getDisplayedNotifications()
    return notifications.some((n: { id: string }) => n.id === NOTIFICATION_ID)
  } catch (error) {
    console.error('❌ Error checking foreground service status:', error)
    return false
  }
}
