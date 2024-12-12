import React, { useState, useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import ScreenWrapper from '@/components/ScreenWrapper';
import PostFeed from '@/components/PostFeed';
import { Post } from '@/types/post';
import { theme } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useIsFocused } from '@react-navigation/native';

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { show: showToast } = useToast();
  const isFocused = useIsFocused();


  useEffect(() => {
    if (!isFocused) return;

    if(isFocused){
      fetchPosts();
    }

    // Subscribe to all relevant changes
    const subscription = supabase
      .channel('post-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          console.log('New post:', payload);
          const { data: newPost, error } = await supabase
            .from('posts')
            .select(`
              id,
              content_type,
              content_url,
              caption,
              expires_at,
              created_at,
              is_challenge_entry,
              challenge_id,
              user_id,
              group_id,
              like_count,
              comment_count,
              view_count,
              share_count,
              user:profiles!inner (
                id,
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching new post:', error);
            return;
          }

          setPosts(prevPosts => [newPost, ...prevPosts]);
          showToast('New post available!', 'info');
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=in.(${posts.map(p => p.id).join(',')})`
        },
        (payload) => {
          console.log('Comment change:', payload);
          setPosts(prevPosts => 
            prevPosts.map(post => {
              if (post.id === payload.new.post_id) {
                return {
                  ...post,
                  comment_count: post.comment_count + (payload.eventType === 'INSERT' ? 1 : -1)
                };
              }
              return post;
            })
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shares',
          filter: `post_id=in.(${posts.map(p => p.id).join(',')})`
        },
        (payload) => {
          console.log('Share added:', payload);
          setPosts(prevPosts => 
            prevPosts.map(post => {
              if (post.id === payload.new.post_id) {
                return {
                  ...post,
                  share_count: post.share_count + 1
                };
              }
              return post;
            })
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isFocused, posts.map(p => p.id).join(',')]);

  const fetchPosts = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content_type,
          content_url,
          caption,
          expires_at,
          created_at,
          is_challenge_entry,
          challenge_id,
          user_id,
          group_id,
          like_count,
          comment_count,
          view_count,
          share_count,
          user:users!inner (
            id,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
  
      console.log('Fetched posts:', postsData); // Debug log
  
      if (postsError) throw postsError;
  
      const transformedPosts: Post[] = (postsData || []).map(post => ({
        ...post,
        user: {
          id: post.user.id,
          username: post.user.username,
          avatar_url: post.user.avatar_url
        }
      }));
  
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(false);
  };

  return (
    <ScreenWrapper bgColor={theme.colors.dark} style={styles.wrapper}>
      <View style={[
        styles.container, 
        { 
          paddingBottom: insets.bottom + 49, // 49 is the tab bar height
          height: windowHeight,
        }
      ]}>
        <PostFeed 
          posts={posts}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={() => {/* Add pagination logic here */}}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});

export default Home;