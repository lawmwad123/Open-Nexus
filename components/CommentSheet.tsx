import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Keyboard,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import Button from './Button';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;
const DRAG_THRESHOLD = 50;

interface CommentSheetProps {
  postId: string;
  isVisible: boolean;
  onClose: () => void;
}

const CommentSheet: React.FC<CommentSheetProps> = memo(({ postId, isVisible, onClose }) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const { userData } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { 
    comments, 
    addComment, 
    loading: refreshing,
    error,
    likeComment,
    deleteComment,
    refreshComments
  } = useComments(postId);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Only allow dragging down
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          // Close sheet
          closeSheet();
        } else {
          // Snap back to open position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const openSheet = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const closeSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [translateY, onClose]);

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      refreshComments();
      setHasLoaded(true);
    }
  }, [isVisible, hasLoaded, refreshComments]);

  useEffect(() => {
    if (isVisible) {
      openSheet();
    }
  }, [isVisible, openSheet]);

  useEffect(() => {
    setHasLoaded(false);
  }, [postId]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    try {
      setIsPosting(true);
      await addComment(comment, replyTo?.id);
      setComment('');
      setReplyTo(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    if (!item?.user) return null; // Skip rendering if user data is missing

    return (
      <View style={styles.commentContainer}>
        <Image
          source={{ 
            uri: item.user.avatar_url || 'https://your-default-avatar-url.png'
          }}
          style={styles.avatar}
          contentFit="cover"
          placeholder={require('@/assets/images/default-avatar.png')}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>
              @{item.user.username}
            </Text>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(item.created_at))}
            </Text>
          </View>
          
          {item.parent?.user && (
            <Text style={styles.replyingTo}>
              Replying to @{item.parent.user.username}
            </Text>
          )}
          
          <Text style={styles.commentText}>{item.content}</Text>
          
          <View style={styles.commentActions}>
            <Pressable 
              style={styles.actionButton}
              onPress={() => likeComment(item.id)}
            >
              <Ionicons
                name={item.is_liked ? "heart" : "heart-outline"}
                size={16}
                color={item.is_liked ? theme.colors.error : theme.colors.text}
              />
              {item.like_count > 0 && (
                <Text style={styles.actionCount}>{item.like_count}</Text>
              )}
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={() => setReplyTo({ 
                id: item.id, 
                username: item.user.username
              })}
            >
              <Ionicons 
                name="chatbubble-outline" 
                size={16} 
                color={theme.colors.text} 
              />
            </Pressable>

            {item.user_id === userData?.id && (
              <Pressable 
                style={styles.actionButton}
                onPress={() => deleteComment(item.id)}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={16} 
                  color={theme.colors.error} 
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={closeSheet}
    >
      <Pressable style={styles.overlay} onPress={closeSheet}>
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Comments</Text>
              <Pressable onPress={closeSheet} hitSlop={8}>
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.commentsList}
              style={styles.commentsContainer}
              inverted={false}
              showsVerticalScrollIndicator={true}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              scrollEventThrottle={16}
              decelerationRate="normal"
              bounces={true}
              overScrollMode="always"
              scrollToOverflowEnabled={true}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              windowSize={21}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refreshComments}
                  tintColor={theme.colors.primary}
                />
              }
            />

            <View style={styles.inputContainer}>
              {replyTo && (
                <View style={styles.replyBanner}>
                  <Text style={styles.replyText}>
                    Replying to @{replyTo.username}
                  </Text>
                  <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                    <Ionicons name="close" size={20} color={theme.colors.text} />
                  </Pressable>
                </View>
              )}
              
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.colors.textLight}
                  style={styles.input}
                  multiline
                  maxLength={500}
                />
                <Button
                  onPress={handleSubmit}
                  loading={isPosting}
                  disabled={!comment.trim() || isPosting}
                  size="sm"
                  title="Post"
                />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  } as const,
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: theme.colors.dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  } as const,
  dragHandle: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.textLight,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  commentsList: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
    gap: 16,
  } as const,
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  } as const,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  timestamp: {
    color: theme.colors.textLight,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  replyingTo: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  commentText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.darkLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sheetContent: {
    flex: 1,
    flexDirection: 'column',
  } as const,
  commentsContainer: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
  } as const,
});

export default CommentSheet; 