import React, { useState, useEffect } from 'react'
import { StyleSheet, StatusBar } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { HomeScreen } from './components/home-screen'
import { RecordingScreen } from './components/recording-screen'
import { ProcessingScreen } from './components/processing-screen'
import { SummaryScreen } from './components/summary-screen'
import { PaywallScreen } from './components/paywall-screen'
import { SettingsScreen } from './components/settings-screen'
import { AllMeetingsScreen } from './components/all-meetings-screen'
import { MeetingDetailScreen } from './components/meeting-detail-screen'
import { Colors } from './constants/Colors'
import { openDatabase } from './src/db/database'
import { Screen } from './src/types/navigation'

interface NavigationState {
  screen: Screen
  meetingId?: string
}

export default function App() {
  const [navigationState, setNavigationState] = useState<NavigationState>({ screen: 'home' })

  useEffect(() => {
    // Initialize database on app start
    openDatabase().catch((error) => {
      console.error('Failed to initialize database:', error)
    })
  }, [])

  const handleNavigate = (screen: Screen, meetingId?: string) => {
    setNavigationState({ screen, meetingId })
  }

  const renderScreen = () => {
    switch (navigationState.screen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />
      case 'recording':
        return <RecordingScreen onNavigate={handleNavigate} />
      case 'processing':
        return <ProcessingScreen onNavigate={handleNavigate} />
      case 'summary':
        return <SummaryScreen onNavigate={handleNavigate} />
      case 'paywall':
        return <PaywallScreen onNavigate={handleNavigate} />
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />
      case 'all-meetings':
        return <AllMeetingsScreen onNavigate={handleNavigate} />
      case 'meeting-detail':
        return (
          <MeetingDetailScreen
            meetingId={navigationState.meetingId || ''}
            onNavigate={handleNavigate}
          />
        )
      default:
        return <HomeScreen onNavigate={handleNavigate} />
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        {renderScreen()}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})
