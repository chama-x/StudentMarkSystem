import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    createUserWithEmailAndPassword, 
    onAuthStateChanged,
    User as FirebaseUser,
    UserCredential
} from 'firebase/auth';
import { createUser } from '../services/realtimeDatabase';
import { User, UserRole } from '../types';
import { auth, database } from '../firebase';
import { toast } from 'react-hot-toast';
import { ref, update } from 'firebase/database';
import { 
    saveUserToStorage, 
    getUserFromStorage, 
    clearUserFromStorage,
    loginUser,
    logoutUser,
    fetchUserData,
    validateCurrentSession
} from '../services/authService';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string, role: UserRole, name: string, grade?: number) => Promise<void>;
    login: (email: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize from local storage on first load
    useEffect(() => {
        console.log('AuthProvider: Initializing from storage');
        const storedUser = getUserFromStorage();
        if (storedUser) {
            console.log(`AuthProvider: Retrieved ${storedUser.role} from storage`);
            setCurrentUser(storedUser);
            setLoading(false);
        }
    }, []);

    // User creation function
    const signup = async (email: string, password: string, role: UserRole, name: string, grade?: number) => {
        try {
            // Prevent students from being created as teachers (extra security)
            const lowerEmail = email.toLowerCase();
            const finalRole = (lowerEmail.includes('student') || lowerEmail.includes('grade')) 
                ? 'student' as UserRole 
                : role;
            
            if (finalRole !== role) {
                console.warn('Signup security: Email suggests student but role was teacher, correcting');
            }
            
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            
            const userData: User = {
                uid: user.uid,
                email: user.email!,
                role: finalRole,
                name,
                ...(finalRole === 'student' ? { grade: grade || 1 } : {})
            };

            await createUser(user.uid, userData);
            
            // Save to localStorage for persistence
            saveUserToStorage(userData);
            
            toast.success('Account created successfully!');
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Failed to create account');
            throw error;
        }
    };

    // User login function
    const login = async (email: string, password: string) => {
        try {
            const userCredential = await loginUser(email, password);
            setCurrentUser(userCredential);
            return { user: auth.currentUser } as UserCredential;
        } catch (error) {
            console.error('Login error in context:', error);
            throw error;
        }
    };

    // User logout function
    const logout = async () => {
        try {
            await logoutUser();
            setCurrentUser(null);
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error in context:', error);
            toast.error('Failed to log out');
            throw error;
        }
    };

    // Firebase auth state listener
    useEffect(() => {
        console.log('Setting up auth state listener');
        let isUnmounting = false;
        
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            try {
                // Prevent operations if component is unmounting
                if (isUnmounting) return;
                
                if (user) {
                    console.log('Auth state: User authenticated:', user.email);
                    
                    try {
                        // Get user data from database and validate role
                        const userData = await fetchUserData(user);
                        
                        // Security: Fix incorrect role in database if needed
                        if (userData.role === 'teacher' && userData.email.toLowerCase().includes('student')) {
                            console.error('CRITICAL SECURITY: Found student with teacher role in database, fixing...');
                            
                            try {
                                const correctUserData = {
                                    ...userData,
                                    role: 'student' as UserRole,
                                    grade: userData.grade || 1
                                };
                                
                                // Update in database
                                await update(ref(database, `users/${userData.uid}`), correctUserData);
                                
                                // Use corrected data
                                saveUserToStorage(correctUserData);
                                setCurrentUser(correctUserData);
                            } catch (roleFixError) {
                                console.error('Failed to fix role in database:', roleFixError);
                                // Still use corrected role in current session for security
                                const correctedUserData = {
                                    ...userData,
                                    role: 'student' as UserRole,
                                    grade: userData.grade || 1
                                };
                                saveUserToStorage(correctedUserData);
                                setCurrentUser(correctedUserData);
                            }
                        } else {
                            // Normal case, user has correct role
                            saveUserToStorage(userData);
                            setCurrentUser(userData);
                        }
                    } catch (userDataError) {
                        console.error('Error getting user data from database:', userDataError);
                        
                        // Try to use saved user data as fallback
                        const storedUser = getUserFromStorage();
                        if (storedUser && storedUser.uid === user.uid) {
                            console.log('Using stored user data as fallback');
                            setCurrentUser(storedUser);
                        } else {
                            // If all else fails, create minimal user data
                            const fallbackUserData: User = {
                                uid: user.uid,
                                email: user.email || 'unknown@example.com',
                                name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
                                role: user.email?.toLowerCase().includes('student') ? 'student' : 'teacher',
                                ...(user.email?.toLowerCase().includes('student') ? { grade: 1 } : {})
                            };
                            setCurrentUser(fallbackUserData);
                        }
                    }
                } else {
                    console.log('Auth state: No user authenticated');
                    
                    // If Firebase says no user but we have valid stored session, keep using it
                    if (validateCurrentSession()) {
                        const storedUser = getUserFromStorage();
                        console.log('No Firebase auth but valid stored session exists:', storedUser?.email);
                        setCurrentUser(storedUser);
                    } else {
                        console.log('No valid session found, clearing user');
                        clearUserFromStorage();
                        setCurrentUser(null);
                    }
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                toast.error('Authentication error occurred');
                
                // Try using stored data on error
                const storedUser = getUserFromStorage();
                if (storedUser) {
                    console.log('Error in auth state change but using stored user data');
                    setCurrentUser(storedUser);
                } else {
                    setCurrentUser(null);
                }
            } finally {
                setLoading(false);
            }
        });

        return () => {
            console.log('Cleaning up auth state listener');
            isUnmounting = true;
            unsubscribe();
        };
    }, []);

    // Set up special handling for page refresh/reload
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Ensure current user is saved before page refresh
            if (currentUser) {
                console.log('Page refresh detected, ensuring user data is saved');
                saveUserToStorage(currentUser);
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUser]);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {(!loading || getUserFromStorage()) && children}
        </AuthContext.Provider>
    );
}; 