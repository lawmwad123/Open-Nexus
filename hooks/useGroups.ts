import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Group } from '@/types/group';
import { useAuth } from '@/contexts/AuthContext';

export const useGroups = () => {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's groups
      const { data: userGroupsData, error: userGroupsError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(
            user_id,
            role
          )
        `)
        .eq('group_members.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (userGroupsError) throw userGroupsError;

      // Fetch recommended groups
      const { data: recommendedGroupsData, error: recommendedGroupsError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(count)
        `)
        .not('is_private', 'eq', true)
        .not('id', 'in', `(${userGroupsData?.map(g => g.id).join(',') || ''})`)
        .limit(5);

      if (recommendedGroupsError) throw recommendedGroupsError;

      // Transform the data to match our Group type
      const transformedUserGroups = userGroupsData?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        image_url: group.image_url,
        created_at: group.created_at,
        created_by: group.created_by,
        is_private: group.is_private,
        member_count: group.member_count,
        unread_count: 0 // We'll implement this later
      })) || [];

      const transformedRecommendedGroups = recommendedGroupsData?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        image_url: group.image_url,
        created_at: group.created_at,
        created_by: group.created_by,
        is_private: group.is_private,
        member_count: group.group_members?.[0]?.count || 0,
        unread_count: 0
      })) || [];

      setUserGroups(transformedUserGroups);
      setRecommendedGroups(transformedRecommendedGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Error fetching groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchGroups();
    }
  }, [user?.id]);

  return {
    userGroups,
    recommendedGroups,
    loading,
    error,
    refreshGroups: fetchGroups,
  };
}; 