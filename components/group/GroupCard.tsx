import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { Group } from '@/types/group';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

const GroupCard = ({ group, onPress }: GroupCardProps) => {
  return (
    <Pressable 
      style={styles.container}
      onPress={onPress}
    >
      <Image 
        source={{ 
          uri: group.image_url || 'https://via.placeholder.com/100'
        }}
        style={styles.image}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{group.name}</Text>
          {group.is_private && (
            <Ionicons name="lock-closed" size={16} color={theme.colors.textLight} />
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {group.description}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.stat}>
            <Ionicons name="people" size={16} color={theme.colors.textLight} />
            <Text style={styles.statText}>{group.member_count}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.md,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
  },
});

export default GroupCard; 