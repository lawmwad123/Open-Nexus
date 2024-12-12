export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  content_type: 'text' | 'image' | 'audio' | 'video';
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  reply_to?: string;
  metadata: {
    caption?: string;
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    thumbnail_url?: string;
  };
  // Joined fields
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  reactions?: GroupMessageReaction[];
  read_by?: GroupMessageRead[];
}

export interface GroupMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface GroupMessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface SendMessageOptions {
  replyTo?: string;
  metadata?: GroupMessage['metadata'];
} 