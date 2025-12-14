import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { Colors } from '@/constants/Colors'

interface CardProps {
  children?: React.ReactNode
  style?: ViewStyle
  className?: string
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function CardHeader({ children, style }: CardProps) {
  return <View style={[styles.header, style]}>{children}</View>
}

export function CardTitle({ children, style }: CardProps) {
  return <Text style={[styles.title, style]}>{children}</Text>
}

export function CardDescription({ children, style }: CardProps) {
  return <Text style={[styles.description, style]}>{children}</Text>
}

export function CardContent({ children, style }: CardProps) {
  return <View style={[styles.content, style]}>{children}</View>
}

export function CardFooter({ children, style }: CardProps) {
  return <View style={[styles.footer, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.cardForeground,
  },
  description: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 0,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
