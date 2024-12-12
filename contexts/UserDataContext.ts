import { createContext, useContext } from 'react';
import { AuthContext } from './AuthContext';

export interface UserData {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
}

export const useCurrentUser = () => {
  const { userData } = useContext(AuthContext);
  return userData;
}; 