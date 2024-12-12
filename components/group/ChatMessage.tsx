import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { GroupMessage } from '@/types/chat';
import AudioManager from './AudioManager'; // Import the new AudioManager

interface ChatMessageProps {
    message: GroupMessage;
    status?: 'sending' | 'sent' | 'failed';
    onRetry?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
    message,
    status = 'sent',
    onRetry
}) => {
    const { userData } = useAuth();
    const isOwnMessage = message.user?.id === userData?.id;
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const audioManager = useRef(AudioManager.getInstance()).current;

    // Cleanup any playing sound when component unmounts
    useEffect(() => {
        return () => {
            audioManager.stop();
        };
    }, []);

    const playSound = async () => {
        // Validate audio message
        if (message.content_type !== 'audio') {
            console.error('Not an audio message:', message);
            return;
        }

        // If already playing, stop the sound
        if (isPlaying) {
            await audioManager.stop();
            return;
        }

        // Play the sound
        await audioManager.play(
            message.content,
            (progress, playing) => {
                // Update progress and playing state
                setAudioProgress(progress);
                setIsPlaying(playing);

                // Animate progress bar
                Animated.timing(animatedWidth, {
                    toValue: progress,
                    duration: 100,
                    useNativeDriver: false
                }).start();
            }
        );
    };

    const renderAudioMessage = () => {
        const audioDuration = message.metadata?.duration || 10; // default to 10 seconds if not provided

        return (
            <View style={styles.audioContainer}>
                <Pressable onPress={playSound} style={styles.audioPlayButton}>
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={24}
                        color={theme.colors.primary}
                    />
                </Pressable>

                <View style={styles.audioProgressContainer}>
                    <Animated.View
                        style={[
                            styles.audioProgressBar,
                            {
                                width: animatedWidth.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 100] // Use actual pixel width for outputRange
                                })
                            }
                        ]}
                    />

                </View>

                <Text style={styles.audioDurationText}>
                    {`${Math.round((1 - audioProgress) * audioDuration)}s`}
                </Text>
            </View>
        );
    };

    // Rest of the component remains the same...
    const renderMessageContent = () => {
        switch (message.content_type) {
            case 'image':
                const [caption, imageUrl] = message.content.split('\n');
                return (
                    <View>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.imageContent}
                            resizeMode="cover"
                        />
                        {caption && <Text style={styles.caption}>{caption}</Text>}
                    </View>
                );
            case 'audio':
                return renderAudioMessage();
            default:
                return <Text style={styles.messageText}>{message.content}</Text>;
        }
    };

    const renderStatus = () => {
        switch (status) {
            case 'sending':
                return (
                    <Ionicons
                        name="time"
                        size={16}
                        color={theme.colors.textLight}
                    />
                );
            case 'failed':
                return (
                    <Pressable onPress={onRetry}>
                        <Ionicons
                            name="alert-circle"
                            size={16}
                            color={theme.colors.error}
                        />
                    </Pressable>
                );
            case 'sent':
                return (
                    <Ionicons
                        name="checkmark-done"
                        size={16}
                        color={theme.colors.primary}
                    />
                );
        }
    };

    const user = message.user || {
        id: 'unknown',
        username: 'Unknown User',
        avatar_url: null
    };

    return (
        <View style={[styles.container, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
            {!isOwnMessage && message.user && (
                <Image
                    source={{ uri: message.user.avatar_url || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                />
            )}
            <View style={[styles.messageContent, isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent]}>
                {!isOwnMessage && message.user && (
                    <Text style={styles.username}>{message.user.username}</Text>
                )}
                {renderMessageContent()}
                <View style={styles.messageFooter}>
                    <Text style={styles.timestamp}>
                        {format(new Date(message.created_at), 'HH:mm')}
                    </Text>
                    {isOwnMessage && (
                        <View style={styles.statusContainer}>
                            {renderStatus()}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 4,
        paddingHorizontal: 16,
        alignItems: 'flex-end',
    },
    ownMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    messageContent: {
        maxWidth: '75%',
        borderRadius: theme.radius.lg,
        borderBottomRightRadius: 0,
        padding: 12,
        backgroundColor: theme.colors.darkLight,
    },
    ownMessageContent: {
        backgroundColor: theme.colors.primary + '40',
    },
    otherMessageContent: {
        backgroundColor: theme.colors.darkLight,
    },
    username: {
        fontSize: 12,
        color: theme.colors.textLight,
        marginBottom: 4,
        fontFamily: 'Inter-Medium',
    },
    messageText: {
        fontSize: 14,
        color: theme.colors.text,
        fontFamily: 'Inter-Regular',
    },
    imageContent: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.darkLight,
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    audioPlayButton: {
        backgroundColor: theme.colors.primary + '20',
        borderRadius: 20,
        padding: 8,
    },
    audioProgressContainer: {
        width: '80%',
        height: 4,
        backgroundColor: theme.colors.darkLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    audioProgressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    audioDurationText: {
        fontSize: 12,
        color: theme.colors.textLight,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    timestamp: {
        fontSize: 10,
        color: theme.colors.textLight,
        fontFamily: 'Inter-Regular',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        marginLeft: 2,
    },
    caption: {
        fontSize: 14,
        color: theme.colors.text,
        fontFamily: 'Inter-Regular',
        marginTop: 8,
    },
});