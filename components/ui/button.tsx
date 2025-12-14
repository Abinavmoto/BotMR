import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native'
import { Colors } from '@/constants/Colors'
import { cn } from '@/lib/utils'

/**
 * Button Component - Standardized button styles for the app
 * 
 * Usage Guidelines:
 * - 'default' (or no variant): Use for all primary action buttons (Change, Retry, Connect, Save, etc.)
 * - 'outline': Use for secondary actions (Cancel buttons in modals)
 * - 'ghost': Use ONLY for icon-only buttons (back, close, navigation icons)
 * - 'destructive': Use for dangerous actions (Delete, Remove, etc.)
 * 
 * This ensures consistency across the entire app.
 */
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  children?: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  style?: ViewStyle
}

export function Button({
  variant = 'default', // Default to filled button for consistency
  size = 'default',
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style,
  ]

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
  ]

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'default' ? Colors.primaryForeground : Colors.foreground} />
      ) : typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  default: {
    backgroundColor: Colors.primary,
  },
  destructive: {
    backgroundColor: Colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  size_default: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  size_sm: {
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  size_lg: {
    height: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  size_icon: {
    width: 36,
    height: 36,
    padding: 0,
  },
  'size_icon-sm': {
    width: 32,
    height: 32,
    padding: 0,
  },
  'size_icon-lg': {
    width: 40,
    height: 40,
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '500',
    fontSize: 14,
  },
  text_default: {
    color: Colors.primaryForeground,
  },
  text_destructive: {
    color: Colors.destructiveForeground,
  },
  text_outline: {
    color: Colors.foreground,
  },
  text_secondary: {
    color: Colors.secondaryForeground,
  },
  text_ghost: {
    color: Colors.foreground,
  },
  text_link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  textSize_default: {
    fontSize: 14,
  },
  textSize_sm: {
    fontSize: 12,
  },
  textSize_lg: {
    fontSize: 16,
  },
  textSize_icon: {
    fontSize: 14,
  },
  'textSize_icon-sm': {
    fontSize: 12,
  },
  'textSize_icon-lg': {
    fontSize: 16,
  },
})
