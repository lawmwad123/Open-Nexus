import { StyleSheet, Text, View, Pressable, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { theme } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import EditProfileModal from '@/components/EditProfileModal'
import { heightPercentage, widthPercentage } from '@/helpers/common'
import { Image } from 'expo-image'
import { getUserImageSrc } from '@/services/imageService'
import { useUserPosts } from '@/hooks/useUserPosts'
import { formatCount } from '@/helpers/common'
import PostOptionsModal from '@/components/PostOptionsModal'
import PostDetailModal from '@/components/PostDetailModal'

const Profile = () => {
  const { user, userData, setUserData } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const { posts, loading: postsLoading, deleting, deletePost, refreshPosts } = useUserPosts(user?.id || '');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Add this effect to fetch user data if not available
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id && !userData) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserData(data);
        }
      }
    };

    fetchUserData();
  }, [user?.id, userData]);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id) {
        const { data: posts } = await supabase
          .from('posts')
          .select('id')
          .eq('userId', user.id);

        const { data: followers } = await supabase
          .from('user_relationships')
          .select('id')
          .eq('following_id', user.id)
          .eq('status', 'accepted');

        const { data: following } = await supabase
          .from('user_relationships')
          .select('id')
          .eq('follower_id', user.id)
          .eq('status', 'accepted');

        setStats({
          posts: posts?.length || 0,
          followers: followers?.length || 0,
          following: following?.length || 0
        });
      }
    };

    fetchStats();
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePostOptions = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleDeletePost = async () => {
    if (selectedPostId) {
      const success = await deletePost(selectedPostId);
      if (success) {
        setSelectedPostId(null);
      }
    }
  };

  const handlePostRefresh = () => {
    refreshPosts();
  };

  return (
    <ScreenWrapper bgColor={theme.colors.dark}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
        >
          <View style={styles.profileHeader}>
            <View style={styles.imageContainer}>
              <Image 
                source={getUserImageSrc(userData?.avatar_url || '')}
                style={styles.profileImage}
                transition={100}
                contentFit="cover"
              />
              <Pressable 
                style={styles.editButton}
                onPress={() => setIsModalVisible(true)}
              >
                <Ionicons name="pencil" size={20} color={theme.colors.text} />
              </Pressable>
            </View>
            <Text style={styles.name}>{userData?.full_name || 'No Name'}</Text>
            <Text style={styles.username}>@{userData?.username || 'username'}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            <Text style={styles.bio}>{userData?.bio || 'No bio yet'}</Text>

            {userData?.phone_number && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>{userData.phone_number}</Text>
              </View>
            )}

            {userData?.address && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>{userData.address}</Text>
              </View>
            )}
          </View>

          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>Posts</Text>
            {postsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={48} color={theme.colors.textLight} />
                <Text style={styles.emptyText}>No posts yet</Text>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {posts.map((post) => (
                  <Pressable 
                    key={post.id} 
                    style={styles.postItem}
                    onPress={() => setSelectedPostId(post.id)}
                  >
                    <Image 
                      source={{ uri: post.content_url }} 
                      style={styles.postImage}
                      contentFit="cover"
                    />
                    {post.content_type === 'video' && (
                      <View style={styles.videoIndicator}>
                        <Ionicons name="play" size={20} color={theme.colors.text} />
                      </View>
                    )}
                    <View style={styles.likeCount}>
                      <Ionicons name="heart" size={12} color={theme.colors.text} />
                      <Text style={styles.likeText}>
                        {formatCount(post.like_count)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      <EditProfileModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)}
        userData={userData}
      />

      <PostOptionsModal
        visible={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
        onDelete={handleDeletePost}
        deleting={deleting}
      />

      <PostDetailModal
        postId={selectedPostId || ''}
        visible={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
        onPostDeleted={handlePostRefresh}
      />
    </ScreenWrapper>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: widthPercentage(6),
    paddingVertical: heightPercentage(2),
    backgroundColor: theme.colors.dark,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
  },
  signOutButton: {
    padding: 8,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: widthPercentage(6),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: heightPercentage(2),
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.dark,
  },
  name: {
    fontSize: 24,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
    marginBottom: heightPercentage(2),
  },
  bio: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: heightPercentage(2),
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: heightPercentage(2),
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.darkLight,
  },
  postsSection: {
    marginTop: heightPercentage(4),
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: heightPercentage(2),
    paddingHorizontal: widthPercentage(6),
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: widthPercentage(6),
    gap: 2,
    paddingBottom: heightPercentage(2),
  },
  postItem: {
    width: (100 / 3 - 1.5) + '%',
    aspectRatio: 1,
    marginBottom: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.sm,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeCount: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  likeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  bottomPadding: {
    height: 100,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 12,
  },
});