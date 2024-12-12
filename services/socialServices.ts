import { supabase } from '@/lib/supabase';
import { Group, GroupMember } from '@/types/group';
import { GroupMessage } from '@/types/chat';
import { Share, ShareOptions, Platform } from 'react-native';
import { Post } from '@/types/post';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

interface GroupMemberWithUserId extends Omit<GroupMember, 'user'> {
  user_id: string;
}

export const getGroups = async () => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: createdGroups, error: createdError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        image_url,
        created_at,
        created_by,
        is_private,
        member_count,
        members:group_members(
          id,
          role,
          joined_at,
          user_id
        )
      `)
      .eq('created_by', userId);

    if (createdError) throw createdError;

    const { data: memberGroups, error: memberError } = await supabase
      .from('group_members')
      .select(`group:groups(
        id,
        name,
        description,
        image_url,
        created_at,
        created_by,
        is_private,
        member_count,
        members:group_members(
          id,
          role,
          joined_at,
          user_id
        )
      )`)
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const myGroups = [
      ...(createdGroups || []),
      ...((memberGroups || []).map(m => m.group).filter(Boolean))
    ].filter((group, index, self) => 
      index === self.findIndex((g) => g?.id === group?.id)
    );

    const myGroupIds = myGroups.map(g => g?.id).filter(Boolean);
    const { data: publicGroups, error: publicGroupsError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        image_url,
        created_at,
        created_by,
        is_private,
        member_count,
        members:group_members(
          id,
          role,
          joined_at,
          user_id
        )
      `)
      .eq('is_private', false)
      .not(
        'id',
        'in',
        myGroupIds.length ? `(${myGroupIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)'
      )
      .order('created_at', { ascending: false });

    if (publicGroupsError) throw publicGroupsError;

    const memberUserIds = [...myGroups, ...(publicGroups || [])]
      .flatMap(group => group?.members || [])
      .map(member => member.user_id)
      .filter(Boolean);

    if (memberUserIds.length === 0) {
      return {
        success: true,
        data: {
          myGroups: [],
          publicGroups: []
        }
      };
    }

    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', memberUserIds);

    if (profilesError) throw profilesError;

    const userProfileMap: Record<string, { id: string; username: string; avatar_url: string | null }> = 
      (userProfiles || []).reduce((acc, profile) => ({
        ...acc,
        [profile.id]: profile
      }), {});

    const transformGroups = (groups: any[]) => groups.map(group => ({
      ...group,
      members: (group?.members || []).map((member: any) => ({
        ...member,
        user: userProfileMap[member.user_id] || {
          id: member.user_id,
          username: 'Unknown User',
          avatar_url: null
        }
      }))
    }));

    return { 
      success: true, 
      data: {
        myGroups: transformGroups(myGroups),
        publicGroups: transformGroups(publicGroups || [])
      }
    };

  } catch (error) {
    console.error('Error fetching groups:', error);
    return { success: false, error };
  }
};

export const getGroupDetails = async (groupId: string) => {
  try {
    // First get the group details with members
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        image_url,
        created_at,
        created_by,
        is_private,
        member_count,
        members:group_members(
          id,
          role,
          joined_at,
          user_id
        )
      `)
      .eq('id', groupId)
      .single();

    if (error) throw error;

    // Then get the user profiles for all members
    const memberUserIds = (group?.members || [])
      .map(member => member.user_id)
      .filter(Boolean);

    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', memberUserIds);

    if (profilesError) throw profilesError;

    // Create a map of user profiles
    const userProfileMap = (userProfiles || []).reduce((acc, profile) => ({
      ...acc,
      [profile.id]: profile
    }), {} as Record<string, { id: string; username: string; avatar_url: string | null }>);

    // Transform the group data to include user profiles
    const transformedGroup = {
      ...group,
      members: group.members.map(member => ({
        ...member,
        user: userProfileMap[member.user_id] || {
          id: member.user_id,
          username: 'Unknown User',
          avatar_url: null
        }
      }))
    };

    return { success: true, data: transformedGroup };
  } catch (error) {
    console.error('Error fetching group:', error);
    return { success: false, error };
  }
};

export const joinGroup = async (groupId: string) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member'
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error joining group:', error);
    return { success: false, error };
  }
};

export const leaveGroup = async (groupId: string) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_members')
      .delete()
      .match({
        group_id: groupId,
        user_id: userId
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error leaving group:', error);
    return { success: false, error };
  }
};

export const getComments = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!user_id(
          id,
          username,
          avatar_url
        ),
        likes:comment_likes(count)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { success: false, error };
  }
};

export const addComment = async (postId: string, content: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First insert the comment and get the full data with user profile
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select(`
        *,
        user:profiles!user_id (
          id,
          username,
          avatar_url
        ),
        likes:comment_likes(count)
      `)
      .single();

    if (error) throw error;

    // Transform the comment to include user data and initial like state
    const transformedComment = {
      ...newComment,
      like_count: 0,
      is_liked: false,
      user: {
        id: newComment.user.id,
        username: newComment.user.username,
        avatar_url: newComment.user.avatar_url
      }
    };

    return { success: true, data: transformedComment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error };
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error };
  }
};

export const likeComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error liking comment:', error);
    return { success: false, error };
  }
};

export const getGroupMessages = async (
  groupId: string,
  options: { limit?: number; before?: string } = {}
) => {
  try {
    const { limit = 50, before } = options;
    
    // First get messages
    let query = supabase
      .from('group_messages')
      .select(`
        id,
        content,
        content_type,
        created_at,
        group_id,
        user_id,
        metadata
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    // Then get user profiles for these messages
    const userIds = messages?.map(msg => msg.user_id) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // Create a map of user profiles
    const userProfileMap = (profiles || []).reduce((acc, profile) => ({
      ...acc,
      [profile.id]: profile
    }), {} as Record<string, { id: string; username: string; avatar_url: string | null }>);

    // Transform messages with user data
    const transformedMessages = messages?.map(msg => ({
      ...msg,
      user: userProfileMap[msg.user_id] || {
        id: msg.user_id,
        username: 'Unknown User',
        avatar_url: null
      }
    }));

    return { success: true, data: transformedMessages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error };
  }
};

export const sendGroupMessage = async (
  groupId: string,
  content: string,
  contentType: GroupMessage['content_type'] = 'text',
  metadata: GroupMessage['metadata'] = {}
) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    // First insert the message
    const { data: message, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: userId,
        content,
        content_type: contentType,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Then get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Combine message with user data
    const transformedMessage = {
      ...message,
      user: profile || {
        id: userId,
        username: 'Unknown User',
        avatar_url: null
      }
    };

    return { success: true, data: transformedMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_message_reads')
      .upsert({
        message_id: messageId,
        read_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false, error };
  }
};

export const addMessageReaction = async (
  messageId: string,
  emoji: string
) => {
  try {
    const { data, error } = await supabase
      .from('group_message_reactions')
      .insert({
        message_id: messageId,
        emoji
      })
      .select(`
        *,
        user:users(
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding reaction:', error);
    return { success: false, error };
  }
};

export const removeMessageReaction = async (
  messageId: string,
  emoji: string
) => {
  try {
    const { error } = await supabase
      .from('group_message_reactions')
      .delete()
      .match({
        message_id: messageId,
        emoji
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing reaction:', error);
    return { success: false, error };
  }
};

export const subscribeToGroupMessages = (groupId: string, onMessage: (message: any) => void) => {
  return supabase
    .channel(`group-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      },
      async (payload) => {
        try {
          // Validate payload
          if (!payload.new || !payload.new.user_id) {
            console.error('Invalid payload:', payload);
            return;
          }

          // Get user profile for the new message
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            onMessage({
              ...payload.new,
              user: {
                id: payload.new.user_id,
                username: 'Unknown User',
                avatar_url: null
              }
            });
            return;
          }

          // Transform message with user data
          const transformedMessage = {
            ...payload.new,
            user: profile || {
              id: payload.new.user_id,
              username: 'Unknown User',
              avatar_url: null
            }
          };

          onMessage(transformedMessage);
        } catch (error) {
          console.error('Error processing new message:', error);
        }
      }
    )
    .subscribe();
};

export const likePost = async (postId: string): Promise<boolean> => {
  try {
    // First check if the post is already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', supabase.auth.getUser().then(res => res.data.user?.id))
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', supabase.auth.getUser().then(res => res.data.user?.id));

      if (deleteError) throw deleteError;
      return false;
    } else {
      // Like the post
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;
      return true;
    }
  } catch (error) {
    console.error('Error in likePost:', error);
    throw error;
  }
};

export const checkLikeStatus = async (postId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking like status:', error);
    throw error;
  }
};

export const getLikeCount = async (postId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting like count:', error);
    throw error;
  }
};

export const sharePost = async (post: Post) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Prepare share content
    const shareMessage = post.caption 
      ? `${post.caption}\n\nShared by @${post.user.username}`
      : `Check out this ${post.content_type} by @${post.user.username}`;

    // Handle media sharing differently based on platform and content type
    if (post.content_type === 'image' || post.content_type === 'video') {
      try {
        // Download the file first
        const localUri = await downloadForSharing(post.content_url);
        if (!localUri) throw new Error('Failed to download media');

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('Sharing is not available on this device');
        }

        // Share the file
        await Sharing.shareAsync(localUri, {
          mimeType: post.content_type === 'image' ? 'image/jpeg' : 'video/mp4',
          dialogTitle: shareMessage,
        });

        // Record the share in database
        const { error } = await supabase
          .from('shares')
          .insert({
            post_id: post.id,
            user_id: user.id,
            platform: Platform.OS
          });

        if (error) throw error;
        return { success: true, data: { shared: true } };
      } catch (err) {
        console.error('Error sharing media:', err);
        // Fallback to sharing just the message if media sharing fails
        const result = await Share.share({ message: shareMessage });
        return { success: true, data: { shared: result.action === Share.sharedAction } };
      }
    } else {
      // For text posts, use regular share
      const result = await Share.share({ message: shareMessage });
      
      if (result.action === Share.sharedAction) {
        const { error } = await supabase
          .from('shares')
          .insert({
            post_id: post.id,
            user_id: user.id,
            platform: result.activityType || Platform.OS
          });

        if (error) throw error;
        return { success: true, data: { shared: true } };
      }
      
      return { success: true, data: { shared: false } };
    }
  } catch (error) {
    console.error('Error sharing post:', error);
    return { success: false, error };
  }
};

const downloadForSharing = async (url: string): Promise<string | null> => {
  try {
    // Create a unique filename
    const filename = `${Date.now()}-${url.split('/').pop() || 'shared-media'}`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    // Download the file
    const { uri } = await FileSystem.downloadAsync(url, fileUri);

    // Ensure the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Downloaded file does not exist');
    }

    return uri;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};