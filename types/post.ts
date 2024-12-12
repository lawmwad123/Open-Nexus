import { User } from './user';
import { Challenge } from './challenge';

export type PostContentType = 'image' | 'video' | 'text';

export interface Post {
  id: string;
  content_type: string;
  content_url: string;
  caption: string;
  expires_at: string;
  created_at: string;
  is_challenge_entry: boolean;
  challenge_id?: string;
  user_id: string;
  group_id?: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  share_count: number;
  is_challenge?: boolean;
  current_participants?: number;
  participants?: ChallengeParticipant[];
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ChallengeParticipant {
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