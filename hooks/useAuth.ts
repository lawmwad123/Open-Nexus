import React, { useContext } from 'react';
import { UserDataContext } from '@/contexts/UserDataContext';

const useAuth = () => {
  const { setUserData } = useContext(UserDataContext);

  // After successful login
  setUserData({
    id: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
    email: user.email
  });
};

export default useAuth; 