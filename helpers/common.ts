import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Format numbers for display (e.g., 1.2K, 1.5M)
export const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Convert width percentage to pixels
export const widthPercentage = (percentage: number): number => {
  return (width * percentage) / 100;
};

// Convert height percentage to pixels
export const heightPercentage = (percentage: number): number => {
  return (height * percentage) / 100;
};

// Get responsive size based on screen width
export const responsiveSize = (size: number): number => {
  return (width * size) / 375; // 375 is base width (iPhone X)
};

// Get responsive font size
export const responsiveFontSize = (size: number): number => {
  return Math.round((width * size) / 375);
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  
  const years = Math.floor(days / 365);
  return `${years}y`;
};