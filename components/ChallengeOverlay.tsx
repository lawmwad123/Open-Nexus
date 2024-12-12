import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface ChallengeOverlayProps {
  challenge?: {
    id: string;
    title: string;
    description: string;
    end_time: string;
    prize?: string;
  };
  isEntry: boolean;
}

const ChallengeOverlay: React.FC<ChallengeOverlayProps> = ({ challenge, isEntry }) => {
  if (!challenge) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="trophy" size={24} color={theme.colors.primary} />
          <Text style={styles.title}>{challenge.title}</Text>
        </View>
        
        {!isEntry && (
          <Pressable style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Challenge</Text>
          </Pressable>
        )}

        {challenge.prize && (
          <View style={styles.prizeContainer}>
            <Text style={styles.prizeLabel}>Prize:</Text>
            <Text style={styles.prizeText}>{challenge.prize}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    padding: 20,
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: theme.radius.lg,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  joinButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  prizeContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prizeLabel: {
    color: theme.colors.textLight,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  prizeText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
});

export default ChallengeOverlay; 