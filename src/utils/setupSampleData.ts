import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, remove, get } from 'firebase/database';
import { auth, database } from '../firebase';
import { SUBJECTS } from '../constants/subjects';
import { toast } from 'react-hot-toast';

export interface SampleStudent {
    email: string;
    name: string;
    grade: number;
}

export const sampleStudents: SampleStudent[] = [
    // Grade 1 Students (5 students)
    { email: 'kasun@school.com', name: 'Kasun Tharaka', grade: 1 },
    { email: 'amal@school.com', name: 'Amal Perera', grade: 1 },
    { email: 'nimal@school.com', name: 'Nimal Silva', grade: 1 },
    { email: 'sunil@school.com', name: 'Sunil Fernando', grade: 1 },
    { email: 'kamal@school.com', name: 'Kamal Gunawardena', grade: 1 },
    
    // Grade 5 Students (5 students)
    { email: 'saman@school.com', name: 'Saman Kumara', grade: 5 },
    { email: 'ruwan@school.com', name: 'Ruwan Jayasinghe', grade: 5 },
    { email: 'chamara@school.com', name: 'Chamara Bandara', grade: 5 },
    { email: 'pradeep@school.com', name: 'Pradeep Kumara', grade: 5 },
    { email: 'nuwan@school.com', name: 'Nuwan Perera', grade: 5 },
    
    // Grade 9 Students (5 students)
    { email: 'lakmal@school.com', name: 'Lakmal Dissanayake', grade: 9 },
    { email: 'thilina@school.com', name: 'Thilina Rajapakse', grade: 9 },
    { email: 'buddhika@school.com', name: 'Buddhika Silva', grade: 9 },
    { email: 'charith@school.com', name: 'Charith Asalanka', grade: 9 },
    { email: 'dasun@school.com', name: 'Dasun Shanaka', grade: 9 },
    
    // One student per other grades
    { email: 'grade2@school.com', name: 'Grade Two Student', grade: 2 },
    { email: 'grade3@school.com', name: 'Grade Three Student', grade: 3 },
    { email: 'grade4@school.com', name: 'Grade Four Student', grade: 4 },
    { email: 'grade6@school.com', name: 'Grade Six Student', grade: 6 },
    { email: 'grade7@school.com', name: 'Grade Seven Student', grade: 7 },
    { email: 'grade8@school.com', name: 'Grade Eight Student', grade: 8 }
];

export const generateSampleMarks = (studentId: string, teacherId: string, grade: number) => {
    const marks = [];
    const now = Date.now();
    
    // Generate 3 marks per subject with different timestamps
    for (let i = 0; i < SUBJECTS.length; i++) {
        for (let j = 0; j < 3; j++) {
            const baseScore = Math.floor(Math.random() * 30) + 60; // Random score between 60 and 90
            marks.push({
                studentId,
                subjectId: i.toString(),
                grade,
                score: baseScore + Math.floor(Math.random() * 10), // Add some variation
                comment: getCommentForScore(baseScore),
                teacherId,
                timestamp: now - (j * 7 * 24 * 60 * 60 * 1000) // Spread over last 3 weeks
            });
        }
    }
    return marks;
};

const getCommentForScore = (score: number): string => {
    if (score >= 85) return "Excellent work! Keep it up!";
    if (score >= 75) return "Good performance. Continue improving.";
    if (score >= 65) return "Satisfactory. More practice needed.";
    return "Needs improvement. Let's work harder.";
};

export const setupSampleData = async (teacherId: string) => {
    try {
        // Clear existing data first
        await clearSampleData(teacherId);
        
        // Create student accounts and add to database
        for (const student of sampleStudents) {
            const password = student.name.split(' ')[0] + '@123'; // FirstName@123
            try {
                // Try to sign in first to check if account exists
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, student.email, password);
                    // If sign in successful, delete the existing account
                    await deleteUser(userCredential.user);
                } catch {
                    // If sign in fails, account doesn't exist, which is fine
                }

                // Create new account
                const userCredential = await createUserWithEmailAndPassword(auth, student.email, password);
                const uid = userCredential.user.uid;
                
                // Add to realtime database
                await set(ref(database, `users/${uid}`), {
                    uid,
                    email: student.email,
                    name: student.name.split(' ')[0].toLowerCase(),
                    role: 'student',
                    grade: student.grade
                });
                
                // Generate and add marks
                const marks = generateSampleMarks(uid, teacherId, student.grade);
                for (const mark of marks) {
                    const markRef = ref(database, `marks/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
                    await set(markRef, mark);
                }
                
                console.log(`Created account for ${student.name} (${student.email}) with password: ${password}`);
                toast.success(`Created account for ${student.name}`);
            } catch (error) {
                console.error(`Error creating account for ${student.email}:`, error);
                toast.error(`Failed to create account for ${student.email}`);
            }
        }
        
        toast.success('Sample data setup completed!');
    } catch (error) {
        console.error('Error setting up sample data:', error);
        toast.error('Failed to set up sample data');
        throw error;
    }
};

export const clearSampleData = async (teacherId: string) => {
    try {
        // Clear marks
        await remove(ref(database, 'marks'));
        
        // Clear student users (keep teacher account)
        const usersRef = ref(database, 'users');
        const teacherData = await get(ref(database, `users/${teacherId}`));
        await remove(usersRef);
        if (teacherData.exists()) {
            await set(ref(database, `users/${teacherId}`), teacherData.val());
        }
        
        console.log('Sample data cleared successfully!');
    } catch (error) {
        console.error('Error clearing sample data:', error);
        throw error;
    }
}; 