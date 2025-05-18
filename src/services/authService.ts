import { 
    signInWithEmailAndPassword, 
    signOut, 
    User as FirebaseUser
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../firebase';
import { User, UserRole } from '../types';

// Constants for storage keys
const USER_DATA_KEY = 'sms_user_data';
const AUTH_TOKEN_KEY = 'sms_auth_token';
const SESSION_EXPIRY_KEY = 'sms_session_expiry';
const USER_ROLE_KEY = 'sms_user_role';

// Session validity - 12 hours
const SESSION_VALIDITY_HOURS = 12;

/**
 * Saves the authenticated user data to local storage
 */
export const saveUserToStorage = (user: User): void => {
    try {
        // Save the essential user data
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        
        // Save role separately for quick access and extra verification
        localStorage.setItem(USER_ROLE_KEY, user.role);
        
        // Set session expiry time
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + SESSION_VALIDITY_HOURS);
        localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toISOString());
        
        console.log(`Auth service: Saved ${user.role} user to storage with expiry at ${expiryTime.toISOString()}`);
    } catch (error) {
        console.error('Error saving user to storage:', error);
    }
};

/**
 * Gets the authenticated user from local storage
 */
export const getUserFromStorage = (): User | null => {
    try {
        // Check if session has expired
        const expiryTimeStr = localStorage.getItem(SESSION_EXPIRY_KEY);
        if (!expiryTimeStr) {
            console.log('Auth service: No session expiry found');
            return null;
        }
        
        const expiryTime = new Date(expiryTimeStr);
        if (expiryTime < new Date()) {
            console.log('Auth service: Session expired');
            clearUserFromStorage();
            return null;
        }
        
        // Get and verify user data
        const userJson = localStorage.getItem(USER_DATA_KEY);
        const roleCheck = localStorage.getItem(USER_ROLE_KEY);
        
        if (!userJson || !roleCheck) {
            console.log('Auth service: Missing user data or role');
            return null;
        }
        
        const user = JSON.parse(userJson) as User;
        
        // Extra validation - ensure the role matches what we expect
        if (user.role !== roleCheck) {
            console.error('Auth service: Role mismatch detected!');
            clearUserFromStorage();
            return null;
        }
        
        console.log(`Auth service: Retrieved ${user.role} user from storage`);
        return user;
    } catch (error) {
        console.error('Error retrieving user from storage:', error);
        clearUserFromStorage();
        return null;
    }
};

/**
 * Removes the authenticated user from local storage
 */
export const clearUserFromStorage = (): void => {
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem('teacherSession'); // clear legacy storage
};

/**
 * Logs in a user and returns their user data with role
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from the database
        const userData = await fetchUserData(user);
        
        // Store token and other data
        if (user.refreshToken) {
            localStorage.setItem(AUTH_TOKEN_KEY, user.refreshToken);
        }
        
        saveUserToStorage(userData);
        
        // Store teacher session if applicable
        if (userData.role === 'teacher') {
            localStorage.setItem('teacherSession', JSON.stringify({
                uid: userData.uid,
                email: userData.email,
                cachedAuth: password.substring(0, 3) + '...' // Only store partial password for verification
            }));
        }
        
        return userData;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

/**
 * Signs out the current user
 */
export const logoutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
        clearUserFromStorage();
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

/**
 * Gets user data from the database
 */
export const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            // User exists in database
            const userData = snapshot.val();
            
            // Critical security check - ensure the role is correctly set
            // If email has 'student' or 'pupil', force role to be 'student'
            const email = firebaseUser.email?.toLowerCase() || '';
            if ((email.includes('student') || 
                 email.includes('pupil') || 
                 email.includes('grade')) && 
                userData.role === 'teacher') {
                console.error('SECURITY ALERT: Student account has teacher role! Forcing to student role.');
                
                // Override the role to student (will be fixed in database later)
                userData.role = 'student' as UserRole;
                
                // Make sure they also have a grade
                if (!userData.grade) {
                    userData.grade = 1;
                }
            }
            
            return userData as User;
        } else {
            // User doesn't exist in database, create a default user object
            const isLikelyStudent = firebaseUser.email?.toLowerCase().includes('student') || 
                                  firebaseUser.email?.toLowerCase().includes('grade');
            
            const newUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                role: isLikelyStudent ? 'student' : 'teacher',
                name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                ...(isLikelyStudent && { grade: 1 })
            };
            
            return newUser;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw new Error('Failed to fetch user data');
    }
};

/**
 * Validates if a current session is active and valid
 */
export const validateCurrentSession = (): boolean => {
    try {
        // Check expiry time
        const expiryTimeStr = localStorage.getItem(SESSION_EXPIRY_KEY);
        if (!expiryTimeStr) return false;
        
        const expiryTime = new Date(expiryTimeStr);
        if (expiryTime < new Date()) {
            clearUserFromStorage();
            return false;
        }
        
        // Check if we have user data and role
        const userData = localStorage.getItem(USER_DATA_KEY);
        const userRole = localStorage.getItem(USER_ROLE_KEY);
        
        if (!userData || !userRole) return false;
        
        // Try to parse user data to ensure it's valid
        try {
            const user = JSON.parse(userData);
            if (!user.uid || !user.email || user.role !== userRole) {
                clearUserFromStorage();
                return false;
            }
        } catch (error) {
            console.error('Invalid user data format:', error);
            clearUserFromStorage();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating session:', error);
        return false;
    }
}; 