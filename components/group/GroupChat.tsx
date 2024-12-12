import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getGroupMessages, sendGroupMessage, subscribeToGroupMessages } from '@/services/socialServices';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from './ChatMessage';
import { ImageCaptionModal } from './ImageCaptionModal';

interface GroupMessage {
  id: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'audio';
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  group_id: string;
  user_id: string;
  metadata: {
    caption?: string;
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    thumbnail_url?: string;
  };
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface GroupChatProps {
  groupId: string;
}

const generateTempId = () => {
  return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export default function GroupChat({ groupId }: GroupChatProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Map<string, GroupMessage>>(new Map());
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();
  const toast = useToast();
  const flatListRef = useRef<FlatList>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const addLocalMessage = (content: string, contentType: GroupMessage['content_type'] = 'text') => {
    if (!userData) return null;
    
    const tempId = generateTempId();
    const localMessage: GroupMessage = {
      id: tempId,
      content,
      content_type: contentType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      group_id: groupId,
      user_id: userData.id || '',
      metadata: {},
      user: {
        id: userData.id || '',
        username: userData.username || 'You',
        avatar_url: userData.avatar_url || null
      }
    };

    // Add to pending messages
    setPendingMessages(prev => new Map(prev).set(tempId, localMessage));
    // Add to messages list immediately
    setMessages(prev => [localMessage, ...prev]);

    return tempId;
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const tempId = addLocalMessage(newMessage.trim());
      if (!tempId) return; // Handle case where user is not authenticated
      
      const messageContent = newMessage.trim();
      setNewMessage(''); // Clear input immediately

      const result = await sendGroupMessage(groupId, messageContent);
      
      if (!result.success) throw result.error;

      // Remove from pending and update with real message
      setPendingMessages(prev => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });

      // Update message in list with real ID
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? result.data : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      // Mark message as failed
      if (tempId) {
        setFailedMessages(prev => new Set(prev).add(tempId));
      }
      toast.show('Failed to send message', 'error');
    }
  };

  const handleNewMessage = async (payload: any) => {
    try {
      // Ignore messages that we sent (they're already in the list)
      if (pendingMessages.has(payload.id)) return;

      // Get the user profile for the new message
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', payload.user_id)
        .single();

      if (profileError) throw profileError;

      // Transform the message with user data
      const transformedMessage: GroupMessage = {
        id: payload.id,
        content: payload.content,
        content_type: payload.content_type,
        created_at: payload.created_at,
        updated_at: payload.updated_at || payload.created_at,
        is_edited: payload.is_edited || false,
        group_id: payload.group_id,
        user_id: payload.user_id,
        metadata: payload.metadata || {},
        user: profile || {
          id: payload.user_id,
          username: 'Unknown User',
          avatar_url: null
        }
      };

      // Add message to the list if it's not already there
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === transformedMessage.id);
        if (exists) return prev;
        return [transformedMessage, ...prev];
      });
    } catch (error) {
      console.error('Error processing new message:', error);
      toast.show('Error loading new message', 'error');
    }
  };

  useEffect(() => {
    loadMessages();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        handleNewMessage
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await getGroupMessages(groupId);
      if (!result.success) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to load messages');
      }
      setMessages(result.data as GroupMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.show('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleImageSend = async (caption: string) => {
    if (!selectedImage) return;

    try {
      const tempId = addLocalMessage(
        caption ? `${caption}\n[Uploading image...]` : '[Uploading image...]',
        'image'
      );

      const file = {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'upload.jpg'
      };

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('group-media')
        .upload(`${groupId}/${Date.now()}.jpg`, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('group-media')
        .getPublicUrl(data.path);

      // Send message with image and caption
      const result = await sendGroupMessage(
        groupId, 
        `${caption}\n${publicUrl}`, 
        'image'
      );

      if (!result.success) throw result.error;

      // Update message in list
      setPendingMessages(prev => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });

      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? result.data : msg
        )
      );

      setSelectedImage(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      setFailedMessages(prev => new Set(prev).add(tempId));
      toast.show('Failed to send image', 'error');
    }
  };

  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.show('Failed to start recording', 'error');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      setIsRecording(false);

      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('group-media')
        .upload(`${groupId}/${Date.now()}.m4a`, {
          uri,
          type: 'audio/m4a',
          name: 'recording.m4a'
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('group-media')
        .getPublicUrl(data.path);

      // Send message with audio
      await sendGroupMessage(groupId, publicUrl, 'audio');
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.show('Failed to send audio', 'error');
    }
  };

  // Render message with status
  const renderMessage = ({ item }: { item: GroupMessage }) => {
    return (
      <ChatMessage message={item} />
    );
  };

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Permission to access microphone is required!', 'error');
      }
    };

    requestPermissions();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onEndReached={() => {
          // Load more messages when user scrolls to top
          // You can implement pagination here
        }}
        onEndReachedThreshold={0.1}
      />
      <View style={styles.inputContainer}>
        <Pressable onPress={pickImage} style={styles.mediaButton}>
          <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
        </Pressable>
        <Pressable 
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.mediaButton, isRecording && styles.recordingButton]}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic-outline"} 
            size={24} 
            color={isRecording ? theme.colors.error : theme.colors.primary} 
          />
        </Pressable>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textLight}
          multiline
          maxLength={500}
        />
        <Pressable 
          onPress={handleSend} 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          disabled={!newMessage.trim()}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={newMessage.trim() ? theme.colors.primary : theme.colors.textLight} 
          />
        </Pressable>
      </View>
      <ImageCaptionModal
        visible={!!selectedImage}
        imageUri={selectedImage || ''}
        onClose={() => setSelectedImage(null)}
        onSend={handleImageSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.darkLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    marginHorizontal: 8,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.dark,
    color: theme.colors.text,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  mediaButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: theme.colors.error + '20',
    borderRadius: 20,
  },
}); 