import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen = false }: LoadingProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color="#2E7D32" />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#2E7D32" />
      {message && <Text style={styles.messageSmall}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  messageSmall: {
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
  },
});
