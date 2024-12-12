import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { Post } from '@/types/post';
import { useLikes } from '@/hooks/useLikes';
import { useShare } from '@/hooks/useShare';
import CommentSheet from './CommentSheet';
import { downloadMedia } from '@/services/downloadService';
import AlertModal from './AlertModal';
import { likePost } from '@/services/socialServices';

interface PostActionsProps {
  post: Post;
  isChallenge: boolean;
}

const PostActions: React.FC<PostActionsProps> = memo(({ post, isChallenge }) => {
  const { isLiked, likeCount, toggleLike, loading: likeLoading } = useLikes(post.id);
  const { sharePost, loading: shareLoading, isProcessing } = useShare(post);
  const [showComments, setShowComments] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (post.content_type === "video" || post.content_type === "image") {
        await downloadMedia(post.content_url, post.content_type);
        setAlertMessage('Media saved to your gallery!');
        setShowAlert(true);
      } else {
        throw new Error('Unsupported media type');
      }
    } catch (error) {
      setAlertMessage('Failed to download media. Please try again.');
      setShowAlert(true);
    } finally {
      setDownloading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.actionButton}
        onPress={toggleLike}
        disabled={likeLoading}
      >
        <Ionicons 
          name={isLiked ? "heart" : "heart-outline"} 
          size={32} 
          color={isLiked ? theme.colors.error : "white"} 
        />
        <Text style={styles.actionText}>{formatCount(likeCount)}</Text>
      </Pressable>

      <Pressable 
        style={styles.actionButton}
        onPress={() => setShowComments(true)}
      >
        <Ionicons name="chatbubble-outline" size={32} color="white" />
        <Text style={styles.actionText}>
          {formatCount(post.comment_count)}
        </Text>
      </Pressable>

      <Pressable 
        style={[
          styles.actionButton,
          shareLoading && styles.actionButtonDisabled
        ]}
        onPress={sharePost}
        disabled={shareLoading || isProcessing}
      >
        {shareLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons 
              name="share-social-outline" 
              size={32} 
              color="white" 
            />
            <Text style={styles.actionText}>
              {formatCount(post.share_count)}
            </Text>
          </>
        )}
      </Pressable>

      <Pressable 
        style={styles.actionButton}
        onPress={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="download-outline" size={32} color="white" />
        )}
        <Text style={styles.actionText}>Save</Text>
      </Pressable>

      <CommentSheet
        postId={post.id}
        isVisible={showComments}
        onClose={() => setShowComments(false)}
      />

      <AlertModal
        visible={showAlert}
        title="Download Status"
        message={alertMessage}
        buttons={[
          {
            text: 'OK',
            onPress: () => setShowAlert(false),
            style: 'default'
          }
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  actionCount: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  actionCountActive: {
    color: theme.colors.error,
  },
  textDisabled: {
    opacity: 0.5,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});

export default PostActions; 