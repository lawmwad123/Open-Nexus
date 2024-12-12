import { createContext, useContext, useState } from 'react'

interface AuthContextType {
  user: User | null;
  userData: User | null;
  setAuth: (user: User | null) => void;
  setUserData: (userData: User) => void;
}

// Define a basic User type - expand this based on your actual user data structure
interface User {
  id?: string;
  full_name?: string;
  username?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserDataState] = useState<User | null>(null)
    const setAuth = (user: User | null) => {
        setUser(user)
    }
    const setUserData = (userData: User) => {
        setUserDataState(userData)
    }
  return (
    <AuthContext.Provider value={{user, userData, setAuth, setUserData}}>
    {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

