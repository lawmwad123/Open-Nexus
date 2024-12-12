import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserImageSrc } from '@/services/imageService';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface MessageProps {
  message: {
    id: string;
    content: string;
    content_type: 'text' | 'image' | 'video' | 'audio';
    created_at: string;
    user: {
      id: string;
      username: string;
      avatar_url: string | null;
    };
  };
}

export function Message({ message }: MessageProps) {
  const { user } = useAuth();
  const isOwnMessage = message.user.id === user?.id;
  const [sound, setSound] = useState<Audio.Sound>();
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const renderContent = () => {
    switch (message.content_type) {
      case 'image':
        return (
          <Image
            source={{ uri: message.content }}
            style={styles.imageContent}
            contentFit="cover"
          />
        );
      case 'audio':
        return (
          <Pressable 
            onPress={() => playAudio(message.content)}
            style={styles.audioButton}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={24} 
              color={theme.colors.text} 
            />
            <Text style={styles.audioText}>Voice Message</Text>
          </Pressable>
        );
      default:
        return (
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {!isOwnMessage && (
        <Image
          source={getUserImageSrc(message.user.avatar_url)}
          style={styles.avatar}
          contentFit="cover"
        />
      )}
      <View style={[
        styles.messageContent,
        isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
      ]}>
        {!isOwnMessage && (
          <Text style={styles.username}>{message.user.username}</Text>
        )}
        {renderContent()}
        <Text style={styles.timestamp}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 8,
    marginVertical: 2,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: theme.colors.darkLight,
  },
  messageContent: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 12,
  },
  ownMessageContent: {
    backgroundColor: theme.colors.primary,
  },
  otherMessageContent: {
    backgroundColor: theme.colors.darkLight,
  },
  username: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  ownMessageText: {
    color: theme.colors.dark,
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.textLight,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  imageContent: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 4,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: theme.colors.darkLight,
    borderRadius: 20,
  },
  audioText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
}); 