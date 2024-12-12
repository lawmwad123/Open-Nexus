import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { theme } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import { Group } from '@/types/group';
import GroupHeader from '@/components/group/GroupHeader';
import GroupContent from '@/components/group/GroupContent';
import { useToast } from '@/contexts/ToastContext';
import { getGroupDetails } from '@/services/socialServices';
import { ScrollView } from 'react-native-gesture-handler';

export default function GroupScreen() {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const result = await getGroupDetails(id as string);
      if (!result.success) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to load group');
      }
      setGroup(result.data as Group);
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.show('Failed to load group', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  return (
    <ScreenWrapper bgColor={theme.colors.dark}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: group?.name || 'Group',
          headerStyle: {
            backgroundColor: theme.colors.dark,
          },
          headerTintColor: theme.colors.text,
        }} 
      />
      <View style={styles.container}>
        {group && (
          <>
            <GroupHeader group={group} />
            <GroupContent group={group} refreshGroup={fetchGroup} />
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 