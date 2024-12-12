import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  FlatList,
  ViewToken,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostItem from './PostItem';
import { Post } from '@/types/post';
import { theme } from '@/constants/theme';

interface PostFeedProps {
  posts: Post[];
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const PostFeed: React.FC<PostFeedProps> = ({ 
  posts, 
  onEndReached,
  onRefresh,
  refreshing 
}) => {
  const [activePostIndex, setActivePostIndex] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActivePostIndex(viewableItems[0].index || 0);
    }
  });

  // Calculate the height for each post item
  const itemHeight = windowHeight - (insets.bottom + 49); // 49 is the tab bar height

  return (
    <FlatList
      data={posts}
      renderItem={({ item, index }) => (
        <View style={[styles.postContainer, { height: itemHeight }]}>
          <PostItem 
            post={item} 
            isActive={index === activePostIndex}
            key={item.id}
          />
        </View>
      )}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
      pagingEnabled
      snapToAlignment="start"
      decelerationRate="fast"
      snapToInterval={itemHeight}
      showsVerticalScrollIndicator={false}
      keyExtractor={item => item.id}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      viewabilityConfig={viewabilityConfig.current}
      onViewableItemsChanged={onViewableItemsChanged.current}
      getItemLayout={(data, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      removeClippedSubviews={false}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={3}
    />
  );
};

const styles = StyleSheet.create({
  postContainer: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default PostFeed; 