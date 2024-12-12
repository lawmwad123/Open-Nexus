import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator,
  FlatList,
  Pressable
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { theme } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import { useChallenges } from '@/hooks/useChallenges';
import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChallengeParticipant {
  id: string;
  user_id: string;
  content_url: string;
  content_type: string;
  vote_count: number;
  user: {
    username: string;
    avatar_url?: string;
  };
}

const ChallengeScreen = () => {
  const { challenges, loading, error, refetch } = useChallenges();
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  const getGridLayout = (participantsCount: number) => {
    switch (participantsCount) {
      case 1:
        return { rows: 1, cols: 1 };
      case 2:
        return { rows: 2, cols: 1 };
      case 3:
        return { rows: 2, cols: 2 }; // First participant takes top half
      case 4:
        return { rows: 2, cols: 2 };
      case 5:
      case 6:
        return { rows: 3, cols: 2 };
      default:
        return { rows: 1, cols: 1 };
    }
  };

  const renderParticipant = (participant: ChallengeParticipant, layout: { width: number, height: number }) => {
    if (!participant) return null;

    return (
      <View style={[styles.participantContainer, { width: layout.width, height: layout.height }]}>
        {participant.content_type === 'video' ? (
          <Video
            source={{ uri: participant.content_url }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true}
            isLooping
            isMuted={false}
          />
        ) : (
          <Image
            source={{ uri: participant.content_url }}
            style={styles.media}
            contentFit="cover"
          />
        )}
        <View style={styles.participantInfo}>
          <Image 
            source={{ uri: participant.user.avatar_url || 'default_avatar_url' }}
            style={styles.avatar}
          />
          <Text style={styles.username}>@{participant.user.username}</Text>
          <Text style={styles.voteCount}>{participant.vote_count} votes</Text>
        </View>
      </View>
    );
  };

  const renderParticipantsGrid = (challenge: Post, cellWidth: number, cellHeight: number) => {
    if (!challenge) return null;

    const { participants = [], current_participants = 0 } = challenge;
    const sortedParticipants = participants ? 
      [...participants].sort((a, b) => b.vote_count - a.vote_count) : 
      [];

    switch (current_participants) {
      case 0:
        return (
          <View style={[styles.participantContainer, { width: cellWidth, height: cellHeight }]}>
            <Text style={styles.emptyText}>Be the first to join!</Text>
          </View>
        );
      
      case 1:
        return sortedParticipants[0] ? 
          renderParticipant(sortedParticipants[0], { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }) :
          null;
      
      case 2:
        return (
          <>
            {sortedParticipants.map((participant, index) => (
              participant && (
                <View key={participant.id} style={{ height: SCREEN_HEIGHT / 2 }}>
                  {renderParticipant(participant, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT / 2 })}
                </View>
              )
            ))}
          </>
        );
      
      case 3:
        return (
          <>
            <View style={{ height: SCREEN_HEIGHT / 2 }}>
              {renderParticipant(sortedParticipants[0], { width: SCREEN_WIDTH, height: SCREEN_HEIGHT / 2 })}
            </View>
            <View style={{ flexDirection: 'row', height: SCREEN_HEIGHT / 2 }}>
              {sortedParticipants.slice(1).map((participant) => (
                participant && (
                  <View key={participant.id} style={{ width: SCREEN_WIDTH / 2 }}>
                    {renderParticipant(participant, { width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 2 })}
                  </View>
                )
              ))}
            </View>
          </>
        );
      
      case 4:
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {sortedParticipants.map((participant) => (
              participant && (
                <View key={participant.id} style={{ width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 2 }}>
                  {renderParticipant(participant, { width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 2 })}
                </View>
              )
            ))}
          </View>
        );
      
      case 5:
      case 6:
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {sortedParticipants.map((participant) => (
              participant && (
                <View key={participant.id} style={{ width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 3 }}>
                  {renderParticipant(participant, { width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 3 })}
                </View>
              )
            ))}
          </View>
        );
      
      default:
        return (
          <View style={[styles.participantContainer, { width: cellWidth, height: cellHeight }]}>
            <Text style={styles.emptyText}>No participants yet</Text>
          </View>
        );
    }
  };

  const handleJoinPress = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
  };

  const handleJoinSuccess = () => {
    refetch(); // Refresh challenges to show new participant
    setSelectedChallengeId(null);
  };

  const renderChallenge = ({ item: challenge }: { item: Post }) => {
    if (!challenge) return null;

    const { rows, cols } = getGridLayout(challenge.current_participants || 0);
    const cellWidth = SCREEN_WIDTH / cols;
    const cellHeight = SCREEN_HEIGHT / rows;

    return (
      <View style={styles.challengeContainer}>
        <View style={styles.participantsGrid}>
          {renderParticipantsGrid(challenge, cellWidth, cellHeight)}
        </View>

        {/* Challenge Info Overlay */}
        <View style={styles.challengeInfo}>
          <Text style={styles.caption}>{challenge.caption || 'Untitled Challenge'}</Text>
          <Text style={styles.timeLeft}>
            Ends {formatDistanceToNow(new Date(challenge.expires_at))}
          </Text>
          {(challenge.current_participants || 0) < 6 && (
            <Pressable 
              style={styles.joinButton}
              onPress={() => handleJoinPress(challenge.id)}
            >
              <Text style={styles.joinButtonText}>Join Challenge</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        onMomentumScrollEnd={event => {
          const index = Math.round(
            event.nativeEvent.contentOffset.y / SCREEN_HEIGHT
          );
          setActiveIndex(index);
        }}
      />

      <JoinChallengeModal
        visible={!!selectedChallengeId}
        challengeId={selectedChallengeId || ''}
        onClose={() => setSelectedChallengeId(null)}
        onSuccess={handleJoinSuccess}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  challengeContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: theme.colors.dark,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  userInfo: {
    position: 'absolute',
    left: 16,
    bottom: 120,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: theme.colors.darkLight,
  },
  username: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  challengeInfo: {
    position: 'absolute',
    left: 16,
    bottom: 80,
    right: 80,
  },
  caption: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  timeLeft: {
    color: theme.colors.textLight,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  actions: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionCount: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  participantsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantContainer: {
    overflow: 'hidden',
  },
  participantInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    marginTop: 10,
  },
  joinButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  voteCount: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  emptyText: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: SCREEN_HEIGHT / 3,
  },
});

export default ChallengeScreen;