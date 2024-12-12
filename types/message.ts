export interface GroupMessage {
  id: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'audio';
  created_at: string;
  group_id: string;
  user_id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
} 