import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { theme } from '@/constants/theme';
import { FilterType } from '@/constants/shaders';

interface FilterSelectorProps {
  currentFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
}

export const FilterSelector = ({ currentFilter, onSelectFilter }: FilterSelectorProps) => {
  const filters: FilterType[] = ['none', 'beauty', 'vintage'];

  return (
    <View style={styles.container}>
      {filters.map((filter) => (
        <Pressable
          key={filter}
          style={[styles.filterButton, currentFilter === filter && styles.activeFilter]}
          onPress={() => onSelectFilter(filter)}
        >
          <Text style={styles.filterText}>{filter}</Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    justifyContent: 'center',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
}); 