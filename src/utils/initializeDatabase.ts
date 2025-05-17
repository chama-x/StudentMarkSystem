import { initializeDatabaseStructure } from '../services/realtimeDatabase';
import { setupInitialTeacher } from './setupInitialTeacher';
import { toast } from 'react-hot-toast';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const initializeDatabase = async () => {
    try {
        // Wait for auth state to be determined
        await new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                if (currentUser) {
                    // Only initialize if user is authenticated
                    resolve();
                }
                unsubscribe();
            });
        });

        // Initialize database structure
        await initializeDatabaseStructure();
        console.log('Database structure initialized successfully');
        
        // Set up initial teacher account
        await setupInitialTeacher();
    } catch (error) {
        console.error('Error initializing database:', error);
        if (error instanceof Error && 
            !error.message.includes('Permission denied') && 
            !error.message.includes('Invalid token')) {
            toast.error('Failed to initialize database');
        }
    }
}; 