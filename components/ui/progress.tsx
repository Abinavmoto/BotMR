import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors } from '@/constants/Colors'

interface ProgressProps {
  value?: number
  style?: any
}

export function Progress({ value = 0, style }: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100)

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { width: `${percentage}%` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 8,
    width: '100%',
    backgroundColor: Colors.primary + '20',
    borderRadius: 4,
    overflow: 'hidden',
  },
  track: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
})
