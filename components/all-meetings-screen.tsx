import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Colors } from '@/constants/Colors'
import { MeetingRepository, Meeting } from '@/src/db/MeetingRepository'
import { NavigationHandler } from '@/src/types/navigation'

interface AllMeetingsScreenProps {
  onNavigate: NavigationHandler
}

export function AllMeetingsScreen({ onNavigate }: AllMeetingsScreenProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMeetings()
    const interval = setInterval(loadMeetings, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadMeetings = async () => {
    try {
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
    return `${mins} min`
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

  const getFilteredMeetings = () => {
    switch (activeTab) {
      case 'ready':
        return meetings.filter((m) => m.status === 'completed' || m.status === 'recorded')
      case 'processing':
        return meetings.filter((m) => m.status === 'processing')
      case 'queued':
        return meetings.filter((m) => m.status === 'recorded')
      case 'failed':
        return meetings.filter((m) => m.status === 'failed')
      default:
        return meetings
    }
  }

  const filteredMeetings = getFilteredMeetings()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
          </Button>
        <Text style={styles.headerTitle}>All Meetings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList currentValue={activeTab} onValueChange={setActiveTab}>
            <TabsTrigger value="all" isActive={activeTab === 'all'} onPress={() => setActiveTab('all')}>
              <Text>All</Text>
            </TabsTrigger>
            <TabsTrigger value="ready" isActive={activeTab === 'ready'} onPress={() => setActiveTab('ready')}>
              <Text>Ready</Text>
            </TabsTrigger>
            <TabsTrigger
              value="processing"
              isActive={activeTab === 'processing'}
              onPress={() => setActiveTab('processing')}
            >
              <Text>Processing</Text>
            </TabsTrigger>
            <TabsTrigger value="queued" isActive={activeTab === 'queued'} onPress={() => setActiveTab('queued')}>
              <Text>Queued</Text>
            </TabsTrigger>
            <TabsTrigger value="failed" isActive={activeTab === 'failed'} onPress={() => setActiveTab('failed')}>
              <Text>Failed</Text>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" currentValue={activeTab}>
            <View style={styles.meetingsList}>
              {isLoading ? (
                <Card>
                  <Text style={styles.loadingText}>Loading...</Text>
                </Card>
              ) : filteredMeetings.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>No meetings found</Text>
                </Card>
              ) : (
                filteredMeetings.map((meeting) => (
            <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                    onPress={() => onNavigate('meeting-detail', meeting.id)}
                  />
                ))
              )}
            </View>
          </TabsContent>

          <TabsContent value="ready" currentValue={activeTab}>
            <View style={styles.meetingsList}>
              {filteredMeetings.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>No ready meetings</Text>
                </Card>
              ) : (
                filteredMeetings.map((meeting) => (
            <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                    onPress={() => onNavigate('meeting-detail', meeting.id)}
            />
                ))
              )}
            </View>
          </TabsContent>

          <TabsContent value="processing" currentValue={activeTab}>
            <View style={styles.meetingsList}>
              {filteredMeetings.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>No processing meetings</Text>
                </Card>
              ) : (
                filteredMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                    onPress={() => onNavigate('meeting-detail', meeting.id)}
                  />
                ))
              )}
            </View>
          </TabsContent>

          <TabsContent value="queued" currentValue={activeTab}>
            <View style={styles.meetingsList}>
              {filteredMeetings.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>No queued meetings</Text>
                </Card>
              ) : (
                filteredMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                    onPress={() => onNavigate('meeting-detail', meeting.id)}
                  />
                ))
              )}
            </View>
          </TabsContent>

          <TabsContent value="failed" currentValue={activeTab}>
            <View style={styles.meetingsList}>
              {filteredMeetings.length === 0 ? (
                <Card>
                  <Text style={styles.emptyText}>No failed meetings</Text>
                </Card>
              ) : (
                filteredMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                    onPress={() => onNavigate('meeting-detail', meeting.id)}
                  />
                ))
              )}
            </View>
          </TabsContent>
        </Tabs>
      </View>
    </ScrollView>
  )
}

interface MeetingCardProps {
  meeting: Meeting
  formatDuration: (seconds: number) => string
  formatDate: (timestamp: number) => string
  onPress: () => void
}

function MeetingCard({ meeting, formatDuration, formatDate, onPress }: MeetingCardProps) {
  const statusConfig = {
    recorded: {
      icon: <View style={styles.recordedDot} />,
      text: 'Recorded',
      color: Colors.mutedForeground,
      bgColor: { borderColor: Colors.border },
    },
    processing: {
      icon: <View style={styles.processingDot} />,
      text: 'Processing',
      color: Colors.accent,
      bgColor: { borderColor: Colors.accent + '4D', backgroundColor: Colors.accent + '0D' },
    },
    completed: {
      icon: <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />,
      text: 'Ready',
      color: Colors.accent,
      bgColor: { borderColor: Colors.accent + '4D', backgroundColor: Colors.accent + '0D' },
    },
    failed: {
      icon: <Ionicons name="alert-circle" size={14} color={Colors.red} />,
      text: 'Failed',
      color: Colors.red,
      bgColor: { borderColor: Colors.red + '4D', backgroundColor: Colors.red + '0D' },
    },
  }

  const config = statusConfig[meeting.status] || statusConfig.recorded

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.meetingCard, config.bgColor]}>
        <View style={styles.cardContent}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{meeting.title}</Text>
            <Text style={styles.cardSubtitle}>
              {formatDuration(meeting.duration_sec)} • {formatDate(meeting.created_at)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusRow, { color: config.color }]}>
            {config.icon}
              <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
            </View>
          </View>
        </View>
    </Card>
    </TouchableOpacity>
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
  tabsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  meetingsList: {
    gap: 12,
    marginTop: 16,
  },
  meetingCard: {
    padding: 16,
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
    alignItems: 'flex-end',
  },
  statusRow: {
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
})
