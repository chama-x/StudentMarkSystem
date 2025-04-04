export const SUBJECTS = [
    'Sinhala',
    'English',
    'Mathematics',
    'Science',
    'History',
    'Buddhism',
    'Health & Physical Education',
    'Art',
    'Tamil'
] as const;

export const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);

export type SubjectName = typeof SUBJECTS[number];

export const initializeSubjects = () => {
    return SUBJECTS.map(name => ({
        name,
        grades: GRADES
    }));
}; 