export type UserRole = 'student' | 'teacher';

export interface User {
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    grade?: number; // Only for students
    subjects?: string[]; // Only for teachers
}

export interface Subject {
    id: string;
    name: string;
    grade: number;
}

export interface Mark {
    id: string;
    studentId: string;
    subjectId: string;
    grade: number;
    score: number;
    comment?: string;
    teacherId: string;
    timestamp: number;
    year: number;
    term: Term;
}

export interface Student {
    id: string;
    name: string;
    grade: number;
    email: string;
}

export interface Teacher {
    id: string;
    name: string;
    email: string;
    subjects: string[]; // Array of subject IDs they teach
}

export type ViewType = 'term-wise' | 'subject-wise';

export type Term = 'Term 1' | 'Term 2' | 'Term 3';

export interface AcademicTerm {
    year: number;
    term: Term;
}

export interface MarkWithTerm extends Mark {
    term: Term;
} 