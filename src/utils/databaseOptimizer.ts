import { ref, get, update } from 'firebase/database';
import { database } from '../firebase';
import { Mark, User } from '../types';

interface OptimizationResults {
    duplicatesRemoved: number;
    nullValuesFixed: number;
    inconsistenciesFixed: number;
    emptyFieldsFixed: number;
}

interface DatabaseUpdates {
    [key: string]: string | number | null | boolean | User | Mark;
}

export const optimizeDatabase = async (): Promise<OptimizationResults> => {
    const optimizationResults: OptimizationResults = {
        duplicatesRemoved: 0,
        nullValuesFixed: 0,
        inconsistenciesFixed: 0,
        emptyFieldsFixed: 0
    };

    try {
        // Get all data
        const marksRef = ref(database, 'marks');
        const usersRef = ref(database, 'users');
        const subjectsRef = ref(database, 'subjects');

        const [marksSnapshot, usersSnapshot, subjectsSnapshot] = await Promise.all([
            get(marksRef),
            get(usersRef),
            get(subjectsRef)
        ]);

        const marks = marksSnapshot.val() || {};
        const users = usersSnapshot.val() || {};
        const subjects = subjectsSnapshot.val() || {};

        const updates: DatabaseUpdates = {};

        // Track processed emails to detect duplicate students
        const processedEmails = new Map<string, string>(); // email -> userId
        const processedMarks = new Set<string>();

        // First pass: Process users and find duplicates
        for (const [userId, user] of Object.entries(users)) {
            const userData = user as User;

            if (userData.role === 'student') {
                if (!userData.email) {
                    updates[`users/${userId}`] = null; // Remove users without email
                    optimizationResults.inconsistenciesFixed++;
                    continue;
                }

                const email = userData.email.toLowerCase();
                const existingUserId = processedEmails.get(email);

                if (existingUserId) {
                    // Found a duplicate student
                    updates[`users/${userId}`] = null; // Remove duplicate user
                    optimizationResults.duplicatesRemoved++;

                    // Move marks from duplicate to original user
                    Object.entries(marks).forEach(([markId, mark]) => {
                        if ((mark as Mark).studentId === userId) {
                            updates[`marks/${markId}/studentId`] = existingUserId;
                            optimizationResults.inconsistenciesFixed++;
                        }
                    });
                } else {
                    processedEmails.set(email, userId);

                    // Fix missing or invalid fields
                    if (!userData.name) {
                        updates[`users/${userId}/name`] = email.split('@')[0];
                        optimizationResults.emptyFieldsFixed++;
                    }
                    if (!userData.grade || userData.grade < 1 || userData.grade > 13) {
                        updates[`users/${userId}/grade`] = 1;
                        optimizationResults.emptyFieldsFixed++;
                    }
                }
            }
        }

        // Process marks
        for (const [markId, mark] of Object.entries(marks)) {
            const markData = mark as Mark;
            const key = `${markData.studentId}-${markData.subjectId}-${markData.timestamp}`;

            // Handle duplicate marks
            if (processedMarks.has(key)) {
                updates[`marks/${markId}`] = null;
                optimizationResults.duplicatesRemoved++;
                continue;
            }
            processedMarks.add(key);

            // Fix null or undefined values
            if (!markData.score && markData.score !== 0) {
                updates[`marks/${markId}/score`] = 0;
                optimizationResults.nullValuesFixed++;
            }

            // Remove marks for deleted students
            if (!users[markData.studentId] || !processedEmails.has(users[markData.studentId].email?.toLowerCase())) {
                updates[`marks/${markId}`] = null;
                optimizationResults.inconsistenciesFixed++;
                continue;
            }

            // Remove marks for non-existent subjects
            if (!subjects[markData.subjectId]) {
                updates[`marks/${markId}`] = null;
                optimizationResults.inconsistenciesFixed++;
                continue;
            }

            // Fix missing fields
            if (!markData.timestamp) {
                updates[`marks/${markId}/timestamp`] = Date.now();
                optimizationResults.emptyFieldsFixed++;
            }
            if (!markData.term) {
                updates[`marks/${markId}/term`] = 'Term 1';
                optimizationResults.emptyFieldsFixed++;
            }
            if (!markData.year) {
                updates[`marks/${markId}/year`] = new Date().getFullYear();
                optimizationResults.emptyFieldsFixed++;
            }
        }

        // Apply all updates
        if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
        }

        return optimizationResults;

    } catch (error) {
        console.error('Error in database optimization:', error);
        throw error;
    }
}; 