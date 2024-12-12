export interface User {
  id: string;
  username: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  address?: string;
  is_verified?: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
} 