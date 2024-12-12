import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { theme } from '@/constants/theme';
import { Group } from '@/types/group';
import { Image } from 'expo-image';
import { getUserImageSrc } from '@/services/imageService';
import { Ionicons } from '@expo/vector-icons';
import GroupChat from '@/components/group/GroupChat';

interface GroupContentProps {
  group: Group;
  refreshGroup: () => Promise<void>;
}

type Tab = 'chat' | 'members' | 'media';

export default function GroupContent({ group, refreshGroup }: GroupContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const renderTab = (tab: Tab, label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <Pressable
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? theme.colors.primary : theme.colors.textLight} 
      />
      <Text style={[
        styles.tabText,
        activeTab === tab && styles.activeTabText
      ]}>
        {label}
      </Text>
    </Pressable>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <GroupChat groupId={group.id} />;
      case 'members':
        return (
          <FlatList
            data={group.members}
            keyExtractor={(item) => item.user.id}
            renderItem={({ item }) => (
              <View style={styles.memberItem}>
                <Image
                  source={getUserImageSrc(item.user.avatar_url)}
                  style={styles.memberAvatar}
                  contentFit="cover"
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.user.username}</Text>
                  <Text style={styles.memberRole}>{item.role}</Text>
                </View>
              </View>
            )}
          />
        );
      case 'media':
        return (
          <View style={styles.mediaContainer}>
            <Text style={styles.placeholder}>Media coming soon...</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {renderTab('chat', 'Chat', 'chatbubble-outline')}
        {renderTab('members', 'Members', 'people-outline')}
        {renderTab('media', 'Media', 'images-outline')}
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.darkLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.darkLight,
  },
  memberInfo: {
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  memberRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
    textTransform: 'capitalize',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
  },
}); 