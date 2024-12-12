export interface Challenge {
  id: string;
  title: string;
  description: string;
  end_time: string;
  prize: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  entry_count?: number;
  total_likes?: number;
} 