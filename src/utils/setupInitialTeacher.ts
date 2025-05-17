import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { createUser, getUser } from '../services/realtimeDatabase';
import { toast } from 'react-hot-toast';

export const setupInitialTeacher = async () => {
    const teacherData = {
        email: 'teacher@school.com',
        password: 'Teacher@123',
        name: 'Main Teacher',
        role: 'teacher' as const,
        subjects: ['Sinhala', 'English', 'Mathematics', 'Science', 'History', 'Buddhism', 'Health & Physical Education', 'Art', 'Tamil']
    };

    try {
        // Try to sign in with teacher credentials first
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                teacherData.email,
                teacherData.password
            );
            
            // Check if user data exists in database
            const existingTeacher = await getUser(userCredential.user.uid);
            if (existingTeacher) {
                console.log('Teacher account already exists');
                return;
            }
        } catch (error) {
            // If sign in fails, create new teacher account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                teacherData.email,
                teacherData.password
            );

            await createUser(userCredential.user.uid, {
                uid: userCredential.user.uid,
                email: teacherData.email,
                name: teacherData.name,
                role: teacherData.role,
                subjects: teacherData.subjects
            });

            console.log('Initial teacher account created successfully');
            toast.success('Teacher account created');
            
            // Log the credentials only on initial creation
            console.log('Teacher Login Credentials:');
            console.log('Email:', teacherData.email);
            console.log('Password:', teacherData.password);
        }
    } catch (error: any) {
        console.error('Error setting up teacher account:', error);
        toast.error('Failed to set up teacher account');
    } finally {
        // Sign out after setup to prevent staying logged in
        await auth.signOut();
    }
}; 