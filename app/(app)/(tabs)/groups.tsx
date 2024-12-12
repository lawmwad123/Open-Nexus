import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getGroups } from '@/services/socialServices';
import { Group } from '@/types/group';
import { theme } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import GroupCard from '@/components/group/GroupCard';
import Loading from '@/components/Loading';
import GroupCreateModal from '@/components/GroupCreateModal';

const Groups = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const { show: showToast } = useToast();
  const router = useRouter();

  const fetchGroups = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      const result = await getGroups();
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to fetch groups');
      }

      setMyGroups(result.data.myGroups || []);
      setPublicGroups(result.data.publicGroups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups(false);
  };

  const openCreateGroupModal = () => {
    setModalVisible(true);
  };

  const closeCreateGroupModal = () => {
    setModalVisible(false);
  };

  if (loading) {
    return (
      <ScreenWrapper bgColor={theme.colors.dark}>
        <Loading size={50} color={theme.colors.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.colors.dark}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          {myGroups.length > 0 ? (
            myGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => router.push(`/group/${group.id}`)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              You haven't joined any groups yet
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public Groups</Text>
          {publicGroups.length > 0 ? (
            publicGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => router.push(`/group/${group.id}`)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No public groups available</Text>
          )}
        </View>

        <Pressable style={styles.createGroupButton} onPress={openCreateGroupModal}>
          <Text style={styles.createGroupButtonText}>Create New Group</Text>
        </Pressable>

        <GroupCreateModal visible={modalVisible} onClose={closeCreateGroupModal} onSuccess={fetchGroups} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
  },
  emptyText: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
  createGroupButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  createGroupButtonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});

export default Groups;