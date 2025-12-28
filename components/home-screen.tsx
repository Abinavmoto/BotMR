import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Colors } from '@/constants/Colors'
import { MeetingRepository, Meeting } from '@/src/db/MeetingRepository'
import { openDatabase } from '@/src/db/database'

import { NavigationHandler } from '@/src/types/navigation'

interface HomeScreenProps {
  onNavigate: NavigationHandler
}

type DateFilter = 'all' | 'today' | 'this-week' | 'this-month'

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)
  const [recentPartialMeeting, setRecentPartialMeeting] = useState<Meeting | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  useEffect(() => {
    loadMeetings()
    checkForPartialRecordings()
    // Refresh when screen comes into focus
    const interval = setInterval(() => {
      loadMeetings()
      checkForPartialRecordings()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const checkForPartialRecordings = async () => {
    try {
      await openDatabase()
      const allMeetings = await MeetingRepository.listMeetings()
      // Find most recent partial recording (within last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const recentPartial = allMeetings.find(
        (m) => m.status === 'recorded_partial' && m.created_at > fiveMinutesAgo
      )
      
      if (recentPartial) {
        setRecentPartialMeeting(recentPartial)
        setShowRecoveryBanner(true)
      } else {
        setShowRecoveryBanner(false)
        setRecentPartialMeeting(null)
      }
    } catch (error) {
      console.error('Error checking for partial recordings:', error)
    }
  }

  const loadMeetings = async () => {
    try {
      await openDatabase() // Ensure DB is initialized
      const loadedMeetings = await MeetingRepository.listMeetings()
      setMeetings(loadedMeetings)
    } catch (error) {
      console.error('Error loading meetings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredMeetings = useMemo(() => {
    let filtered = [...meetings]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((meeting) =>
        meeting.title.toLowerCase().includes(query)
      )
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      let cutoffTime = 0

      switch (dateFilter) {
        case 'today': {
          const today = new Date()
          cutoffTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
          break
        }
        case 'this-week': {
          const today = new Date()
          const dayOfWeek = today.getDay()
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          const monday = new Date(today)
          monday.setDate(today.getDate() - daysToMonday)
          monday.setHours(0, 0, 0, 0)
          cutoffTime = monday.getTime()
          break
        }
        case 'this-month': {
          const now = new Date()
          cutoffTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
          break
        }
      }

      filtered = filtered.filter((meeting) => meeting.created_at >= cutoffTime)
    }

    return filtered
  }, [meetings, searchQuery, dateFilter])

  const getStatusConfig = (status: Meeting['status']) => {
    switch (status) {
      case 'recorded':
        return {
          icon: <View style={styles.recordedDot} />,
          text: 'Recorded',
          color: Colors.mutedForeground,
        }
      case 'recorded_partial':
        return {
          icon: <Ionicons name="alert-circle" size={14} color={Colors.orange} />,
          text: 'Partial',
          color: Colors.orange,
        }
      case 'processing':
        return {
          icon: <View style={styles.processingDot} />,
          text: 'Processing',
          color: Colors.accent,
        }
      case 'completed':
        return {
          icon: <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />,
          text: 'Ready',
          color: Colors.accent,
        }
      case 'failed':
        return {
          icon: <Ionicons name="alert-circle" size={14} color={Colors.red} />,
          text: 'Failed',
          color: Colors.red,
        }
      default:
        return {
          icon: <View style={styles.recordedDot} />,
          text: 'Recorded',
          color: Colors.mutedForeground,
        }
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BotMR</Text>
        <View style={styles.headerButtons}>
          <Button variant="ghost" size="icon" onPress={() => onNavigate('all-meetings')}>
            <Ionicons name="folder-open-outline" size={20} color={Colors.foreground} />
          </Button>
          <Button variant="ghost" size="icon" onPress={() => onNavigate('settings')}>
            <Ionicons name="settings-outline" size={20} color={Colors.foreground} />
          </Button>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Large Record Button */}
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => onNavigate('recording')}
          activeOpacity={0.8}
        >
          <View style={styles.recordButtonInner} />
          <Ionicons name="mic" size={96} color={Colors.accentForeground} />
        </TouchableOpacity>

        <View style={styles.recordTextContainer}>
          <Text style={styles.recordTitle}>Ready to Record</Text>
          <Text style={styles.recordSubtitle}>Tap to start your meeting</Text>
        </View>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Meetings</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.mutedForeground} style={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search meetings..."
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={Colors.mutedForeground} />
            </Button>
          )}
        </View>

        {/* Date Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['all', 'today', 'this-week', 'this-month'] as DateFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onPress={() => setDateFilter(filter)}
                style={styles.filterButton}
              >
                <Text style={dateFilter === filter ? styles.filterTextActive : styles.filterText}>
                  {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : filter === 'this-week' ? 'This Week' : 'This Month'}
                </Text>
              </Button>
            ))}
          </ScrollView>
        </View>

        {/* Recovery Banner for Partial Recordings */}
        {showRecoveryBanner && recentPartialMeeting && (
          <Card style={styles.recoveryCard}>
            <View style={styles.recoveryContent}>
              <Ionicons name="information-circle" size={20} color={Colors.orange} />
              <View style={styles.recoveryTextContainer}>
                <Text style={styles.recoveryTitle}>
                  Previous recording was interrupted
                </Text>
                <Text style={styles.recoverySubtitle}>
                  Partial audio is available. Tap to view.
                </Text>
              </View>
              <Button
                size="sm"
                variant="outline"
                onPress={() => {
                  setShowRecoveryBanner(false)
                  onNavigate('meeting-detail', recentPartialMeeting.id)
                }}
              >
                <Text>View</Text>
              </Button>
            </View>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <Text style={styles.loadingText}>Loading meetings...</Text>
        </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {meetings.length === 0
                ? 'No meetings yet. Start recording to create your first meeting!'
                : 'No meetings match your search or filter criteria.'}
            </Text>
        </Card>
        ) : (
          filteredMeetings.slice(0, 5).map((meeting) => {
            const statusConfig = getStatusConfig(meeting.status)
            return (
              <TouchableOpacity
                key={meeting.id}
                onPress={() => onNavigate('meeting-detail', meeting.id)}
              >
                <Card>
                  <View style={styles.cardContent}>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{meeting.title}</Text>
                      <Text style={styles.cardSubtitle}>
                        {formatDuration(meeting.duration_sec)} • {formatDate(meeting.created_at)}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      {statusConfig.icon}
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
                    </View>
                  </View>
        </Card>
              </TouchableOpacity>
            )
          })
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    marginVertical: 48,
  },
  recordButton: {
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonInner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 96,
    backgroundColor: Colors.background + '1A',
  },
  recordTextContainer: {
    alignItems: 'center',
  },
  recordTitle: {
    fontSize: 30,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 8,
  },
  recordSubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  recentSection: {
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.mutedForeground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 40,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 24,
  },
  filterButton: {
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    color: Colors.foreground,
  },
  filterTextActive: {
    fontSize: 12,
    color: Colors.primaryForeground,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
  },
  recordedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.mutedForeground,
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    padding: 16,
  },
  recoveryCard: {
    marginBottom: 16,
    borderColor: Colors.orange + '4D',
    backgroundColor: Colors.orange + '0D',
    padding: 16,
  },
  recoveryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recoveryTextContainer: {
    flex: 1,
  },
  recoveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orange,
    marginBottom: 4,
  },
  recoverySubtitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
})
