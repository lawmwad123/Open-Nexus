export interface CommentUser {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  like_count: number;
  is_liked: boolean;
  user: CommentUser;
  parent?: {
    id: string;
    user: CommentUser;
  } | null;
}

export interface CommentLikeResponse {
  is_liked: boolean;
  like_count: number;
} 