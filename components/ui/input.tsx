import React from 'react'
import { TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { Colors } from '@/constants/Colors'

interface InputProps {
  value?: string
  onChangeText?: (text: string) => void
  placeholder?: string
  style?: ViewStyle | TextStyle
  autoFocus?: boolean
  multiline?: boolean
  numberOfLines?: number
  editable?: boolean
}

export function Input({
  value,
  onChangeText,
  placeholder,
  style,
  autoFocus,
  multiline,
  numberOfLines,
  editable = true,
}: InputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.mutedForeground}
      autoFocus={autoFocus}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={editable}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    height: 36,
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
