import React from 'react'
import { TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { Colors } from '@/constants/Colors'

interface TextareaProps {
  value?: string
  onChangeText?: (text: string) => void
  placeholder?: string
  style?: ViewStyle | TextStyle
  autoFocus?: boolean
  numberOfLines?: number
  editable?: boolean
}

export function Textarea({
  value,
  onChangeText,
  placeholder,
  style,
  autoFocus,
  numberOfLines = 4,
  editable = true,
}: TextareaProps) {
  return (
    <TextInput
      style={[styles.textarea, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.mutedForeground}
      autoFocus={autoFocus}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      editable={editable}
    />
  )
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 64,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.input,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.foreground,
  },
})
