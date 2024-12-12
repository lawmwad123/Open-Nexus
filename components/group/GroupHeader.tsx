import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { Group } from '@/types/group';
import { getUserImageSrc } from '@/services/imageService';

interface GroupHeaderProps {
  group: Group;
}

export default function GroupHeader({ group }: GroupHeaderProps) {
  return (
    <View style={styles.container}>
      <Image
        source={getUserImageSrc(group.image_url)}
        style={styles.coverImage}
        contentFit="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{group.name}</Text>
          {group.description && (
            <Text style={styles.description}>{group.description}</Text>
          )}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{group.member_count}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            {group.is_private && (
              <View style={styles.privateTag}>
                <Ionicons name="lock-closed" size={12} color={theme.colors.text} />
                <Text style={styles.privateText}>Private</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.darkLight,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.dark,
  },
  content: {
    padding: 16,
  },
  info: {
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  privateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
}); 