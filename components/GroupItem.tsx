import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '@/helpers/common';

interface GroupItemProps extends Group {
  onPress: () => void;
  unreadCount?: number;
}

const GroupItem: React.FC<GroupItemProps> = ({
  name,
  imageUrl,
  lastMessage,
  unreadCount = 0,
  onPress,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMessagePreview = () => {
    if (!lastMessage) return '';
    switch (lastMessage.type) {
      case 'image':
        return ' Photo';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎵 Audio message';
      default:
        return lastMessage.text;
    }
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initials}>{getInitials(name)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {lastMessage && (
            <Text style={styles.time}>
              {formatTimeAgo(new Date(lastMessage.timestamp))}
            </Text>
          )}
        </View>
        
        {lastMessage && (
          <View style={styles.messagePreview}>
            <Text style={styles.previewText} numberOfLines={1}>
              {getMessagePreview()}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: theme.colors.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  initialsContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
});

export default GroupItem; 