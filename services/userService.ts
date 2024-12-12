import { supabase } from '@/lib/supabase';
import { User } from '@/types/user';

export const createUserProfile = async (
  userId: string,
  email: string,
  username?: string,
  fullName?: string,
  avatarUrl?: string
) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          username: username || email.split('@')[0],
          full_name: fullName || '',
          avatar_url: avatarUrl || '',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}; 