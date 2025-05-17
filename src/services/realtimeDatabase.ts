import { 
    ref, 
    set, 
    get, 
    push, 
    update, 
    remove,
    query, 
    orderByChild, 
    equalTo,
    DataSnapshot
} from 'firebase/database';
import { database } from '../firebase';
import { Mark, Student, Subject, User } from '../types';
import { SUBJECTS } from '../constants/subjects';

// Initialize Subjects
export const initializeSubjects = async () => {
    const subjectsRef = ref(database, 'subjects');
    
    try {
        const snapshot = await get(subjectsRef);
        if (!snapshot.exists()) {
            const subjectsData = SUBJECTS.map(name => ({
                name,
                active: true
            }));
            
            await set(subjectsRef, subjectsData);
        }
    } catch (error) {
        console.error('Error initializing subjects:', error);
        throw error;
    }
};

// User Operations
export const createUser = async (userId: string, userData: User) => {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, userData);
};

export const getUser = async (userId: string) => {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
    console.log('updateUser: Updating user', userId, 'with data:', updates);
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, updates);
    console.log('updateUser: User updated successfully');
};

// Student Operations
export const getStudentsByGrade = async (grade: number) => {
    console.log('getStudentsByGrade: Fetching students for grade', grade);
    const usersRef = ref(database, 'users');
    const gradeQuery = query(usersRef, orderByChild('grade'), equalTo(grade));
    
    const snapshot = await get(gradeQuery);
    const students: Student[] = [];
    
    if (snapshot.exists()) {
        console.log('getStudentsByGrade: Raw users data:', snapshot.val());
        snapshot.forEach((childSnapshot) => {
            const student = childSnapshot.val();
            console.log('getStudentsByGrade: Processing user:', childSnapshot.key, student);
            
            if (student.role === 'student') {
                students.push({
                    id: childSnapshot.key!,
                    name: student.name,
                    email: student.email,
                    grade: student.grade
                });
            }
        });
    } else {
        console.log('getStudentsByGrade: No users found for grade', grade);
    }
    
    console.log('getStudentsByGrade: Returning students:', students);
    return students;
};

// Mark Operations
export const addMark = async (markData: Omit<Mark, 'id'>) => {
    const marksRef = ref(database, 'marks');
    const newMarkRef = push(marksRef);
    
    await set(newMarkRef, {
        ...markData,
        timestamp: Date.now()
    });
    
    return {
        id: newMarkRef.key!,
        ...markData
    };
};

export const updateMark = async (markId: string, updates: Partial<Mark>) => {
    const markRef = ref(database, `marks/${markId}`);
    await update(markRef, {
        ...updates,
        timestamp: Date.now()
    });
};

export const getStudentMarks = async (studentId: string) => {
    console.log('getStudentMarks: Fetching marks for student', studentId);
    const marksRef = ref(database, 'marks');
    const studentMarksQuery = query(marksRef, orderByChild('studentId'), equalTo(studentId));
    
    const snapshot = await get(studentMarksQuery);
    const marks: Mark[] = [];
    
    if (snapshot.exists()) {
        console.log('getStudentMarks: Raw marks data:', snapshot.val());
        snapshot.forEach((childSnapshot) => {
            const key = childSnapshot.key;
            const val = childSnapshot.val();
            console.log('getStudentMarks: Processing mark:', key, val);
            
            if (key && val) {
                marks.push({
                    id: key,
                    ...val
                });
            } else {
                console.log('getStudentMarks: Invalid mark data:', { key, val });
            }
        });
    } else {
        console.log('getStudentMarks: No marks found for student', studentId);
    }
    
    const sortedMarks = marks.sort((a, b) => b.timestamp - a.timestamp);
    console.log('getStudentMarks: Returning sorted marks:', sortedMarks);
    return sortedMarks;
};

// Subject Operations
export const getSubjects = async (grade: number) => {
    console.log('getSubjects: Fetching subjects for grade', grade);
    const subjectsRef = ref(database, 'subjects');
    const snapshot = await get(subjectsRef);
    
    const subjects: Subject[] = [];
    if (snapshot.exists()) {
        console.log('getSubjects: Raw subjects data:', snapshot.val());
        snapshot.forEach((childSnapshot: DataSnapshot) => {
            const key = childSnapshot.key;
            const val = childSnapshot.val();
            console.log('getSubjects: Processing subject:', key, val);
            
            if (key && val && val.name) {
                subjects.push({
                    id: key,
                    name: val.name,
                    grade
                });
            } else {
                console.log('getSubjects: Invalid subject data:', { key, val });
            }
        });
    } else {
        console.log('getSubjects: No subjects found in database');
    }
    
    console.log('getSubjects: Returning subjects:', subjects);
    return subjects;
};

export const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
    const subjectsRef = ref(database, 'subjects');
    const newSubjectRef = push(subjectsRef);
    
    await set(newSubjectRef, subjectData);
    return {
        id: newSubjectRef.key!,
        ...subjectData
    };
};

export const updateSubject = async (subjectId: string, updates: Partial<Subject>) => {
    const subjectRef = ref(database, `subjects/${subjectId}`);
    await update(subjectRef, updates);
};

export const deleteSubject = async (subjectId: string) => {
    // Delete the subject
    const subjectRef = ref(database, `subjects/${subjectId}`);
    await remove(subjectRef);
    
    // Delete all marks associated with this subject
    const marksRef = ref(database, 'marks');
    const marksQuery = query(marksRef, orderByChild('subjectId'), equalTo(subjectId));
    const snapshot = await get(marksQuery);
    
    if (snapshot.exists()) {
        const updates: { [key: string]: null } = {};
        snapshot.forEach((childSnapshot) => {
            updates[`marks/${childSnapshot.key}`] = null;
        });
        await update(ref(database), updates);
    }
};

// Initialize Database Structure
export const initializeDatabaseStructure = async () => {
    try {
        // Check if the database structure exists
        const dbRef = ref(database);
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists()) {
            // Initialize with default structure
            const initialData = {
                users: {},
                marks: {},
                subjects: {}
            };

            // First create the basic structure
            await set(dbRef, initialData);

            // Then initialize subjects
            const subjectsRef = ref(database, 'subjects');
            const subjectsData = SUBJECTS.reduce((acc, name) => {
                acc[name.toLowerCase().replace(/\s+/g, '_')] = {
                    name,
                    active: true
                };
                return acc;
            }, {} as Record<string, { name: string; active: boolean }>);

            await set(subjectsRef, subjectsData);
            console.log('Database initialized with default structure');
        } else {
            console.log('Database structure already exists');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}; 