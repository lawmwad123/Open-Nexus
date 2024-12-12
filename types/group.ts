import { User } from './user';

export type MessageType = 'text' | 'image' | 'video' | 'audio';

export interface GroupMember {
  id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  created_at: string;
  created_by: string;
  is_private: boolean;
  member_count: number;
  members: GroupMember[];
}