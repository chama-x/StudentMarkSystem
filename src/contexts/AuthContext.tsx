import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    User as FirebaseUser,
    UserCredential,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { createUser, getUser, updateUser } from '../services/realtimeDatabase';
import { User, UserRole } from '../types';
import { auth, database } from '../firebase';
import { toast } from 'react-hot-toast';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';

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

    // Initialize persistence when the provider mounts
    useEffect(() => {
        const initAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                console.log('Firebase Auth persistence initialized');
            } catch (error) {
                console.error('Error setting auth persistence:', error);
            }
        };
        initAuth();
    }, []);

    const signup = async (email: string, password: string, role: UserRole, name: string, grade?: number) => {
        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            
            const userData: User = {
                uid: user.uid,
                email: user.email!,
                role,
                name,
                ...(grade && { grade })
            };

            await createUser(user.uid, userData);
            toast.success('Account created successfully!');
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Failed to create account');
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('teacherSession');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to log out');
            throw error;
        }
    };

    useEffect(() => {
        console.log('Setting up auth state listener');
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            try {
                if (user) {
                    console.log('User authenticated:', user.email);
                    const userData = await getUser(user.uid);
                    
                    if (userData) {
                        console.log('User data found:', userData);
                        
                        // Ensure student has a grade property
                        if (userData.role === 'student' && !userData.grade) {
                            console.log('Student user missing grade - fetching from database');
                            try {
                                // Try to find the user's grade from the database by checking marks
                                const marksRef = ref(database, 'marks');
                                const studentMarksQuery = query(marksRef, orderByChild('studentId'), equalTo(user.uid));
                                const snapshot = await get(studentMarksQuery);
                                
                                if (snapshot.exists()) {
                                    // Get the first mark and extract the grade
                                    let grade: number | null = null;
                                    snapshot.forEach((childSnapshot) => {
                                        if (!grade) {
                                            grade = childSnapshot.val().grade;
                                        }
                                    });
                                    
                                    if (grade) {
                                        console.log(`Found grade ${grade} for student ${user.email} from marks`);
                                        userData.grade = grade;
                                        // Update the user record with the grade
                                        await updateUser(user.uid, { grade });
                                    } else {
                                        // Default to grade 1 if no grade found from marks
                                        userData.grade = 1;
                                        await updateUser(user.uid, { grade: 1 });
                                    }
                                } else {
                                    // Default to grade 1 if no marks found
                                    userData.grade = 1;
                                    await updateUser(user.uid, { grade: 1 });
                                }
                            } catch (error) {
                                console.error('Error finding student grade:', error);
                                // Set a default grade
                                userData.grade = 1;
                            }
                        }
                        
                        setCurrentUser(userData as User);
                    } else {
                        // Check if this is a teacherSession in localStorage
                        const teacherSession = localStorage.getItem('teacherSession');
                        
                        if (teacherSession) {
                            // This means we're in a teacher session but the auth state changed
                            // (likely due to student creation) - we should handle this specially
                            console.log('Teacher session detected, maintaining session');
                            
                            // Try to get the teacher user
                            const teacherData = JSON.parse(teacherSession);
                            const teacherUser = await getUser(teacherData.uid);
                            
                            if (teacherUser) {
                                setCurrentUser(teacherUser as User);
                                // Re-authenticate as the teacher silently
                                // This is just for the auth state, without affecting the UI
                                try {
                                    await signInWithEmailAndPassword(auth, teacherData.email, teacherData.cachedAuth);
                                } catch (error) {
                                    // If we can't re-auth, we'll just keep the teacher data anyway
                                    console.warn('Failed to re-authenticate teacher', error);
                                }
                                return;
                            }
                        }
                        
                        // If no teacher session or teacher not found, fall back to creating basic user data
                        console.log('Creating basic user data');
                        
                        // Try to determine if this is a student account by email pattern
                        const isStudentEmail = user.email?.includes('student') || user.email?.includes('grade');
                        const defaultRole: UserRole = isStudentEmail ? 'student' : 'teacher';
                        
                        // For students, try to extract grade from email or default to grade 1
                        let grade = 1;
                        if (defaultRole === 'student') {
                            const gradeMatch = user.email?.match(/grade(\d+)/i);
                            if (gradeMatch && gradeMatch[1]) {
                                grade = parseInt(gradeMatch[1], 10);
                            }
                        }
                        
                        const basicUserData: User = {
                            uid: user.uid,
                            email: user.email!,
                            role: defaultRole,
                            name: user.displayName || user.email!.split('@')[0],
                            ...(defaultRole === 'student' ? { grade } : {})
                        };
                        
                        await createUser(user.uid, basicUserData);
                        setCurrentUser(basicUserData);
                    }
                } else {
                    console.log('No user authenticated');
                    localStorage.removeItem('teacherSession');
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                toast.error('Authentication error occurred');
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            console.log('Cleaning up auth state listener');
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 