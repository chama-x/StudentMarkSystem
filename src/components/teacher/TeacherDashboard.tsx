import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentManagement from './StudentManagement';
import RegistrationTool from './RegistrationTool';
import SubjectManagement from './SubjectManagement';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';
import { Student, Mark, Term, Subject } from '../../types';
import { getSubjects, addMark, updateMark, getStudentMarks } from '../../services/realtimeDatabase';
import { toast } from 'react-hot-toast';

// Define interfaces for database objects to fix TypeScript errors
interface DatabaseUser {
    uid: string;
    email: string;
    name: string;
    role: string;
    grade: number;
}

// Create standalone versions for the dashboard
const StandaloneMarksComponent = () => {
    const { currentUser } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedGrade, setSelectedGrade] = useState<number>(1);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentMarks, setStudentMarks] = useState<Mark[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form state for adding/editing marks
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [score, setScore] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedTerm, setSelectedTerm] = useState<Term>('Term 1');
    const [submitting, setSubmitting] = useState(false);
    
    // Generate array of years (current year and 2 years back)
    const availableYears = Array.from({ length: 3 }, (_, i) => selectedYear - i);

    useEffect(() => {
        fetchStudents();
        fetchSubjects();
    }, [selectedGrade]);

    const fetchSubjects = async () => {
        try {
            const fetchedSubjects = await getSubjects(selectedGrade);
            setSubjects(fetchedSubjects);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);
            const usersData = snapshot.val() || {};
            
            const studentsList = Object.entries(usersData)
                .filter(entry => {
                    const user = entry[1] as DatabaseUser;
                    return user.role === 'student' && Number(user.grade) === selectedGrade;
                })
                .map(entry => {
                    const id = entry[0];
                    const user = entry[1] as DatabaseUser;
                    return {
                        id,
                        name: user.name,
                        email: user.email,
                        grade: Number(user.grade)
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            setStudents(studentsList);
            setSelectedStudent(null);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchStudentMarks = async (studentId: string) => {
        try {
            setLoading(true);
            const fetchedMarks = await getStudentMarks(studentId);
            setStudentMarks(fetchedMarks);
        } catch (error) {
            console.error('Error fetching marks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        fetchStudentMarks(student.id);
        
        // Reset form when selecting a new student
        setSelectedSubject('');
        setScore('');
        setComment('');
    };
    
    const determineTermFromDate = (timestamp: number): Term => {
        const date = new Date(timestamp);
        const month = date.getMonth();
        
        if (month >= 0 && month <= 3) return 'Term 1';
        if (month >= 4 && month <= 7) return 'Term 2';
        return 'Term 3';
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedStudent || !selectedSubject || !score || !currentUser) {
            toast.error('Please fill in all required fields');
            return;
        }

        const scoreNum = Number(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
            toast.error('Score must be between 0 and 100');
            return;
        }

        try {
            setSubmitting(true);
            
            const existingMark = studentMarks.find(
                mark => mark.subjectId === selectedSubject && mark.term === selectedTerm && mark.year === selectedYear
            );

            const markData: Omit<Mark, 'id'> = {
                studentId: selectedStudent.id,
                subjectId: selectedSubject,
                grade: selectedGrade,
                score: scoreNum,
                comment,
                teacherId: currentUser.uid,
                timestamp: Date.now(),
                year: selectedYear,
                term: selectedTerm
            };

            if (existingMark) {
                await updateMark(existingMark.id, markData);
                toast.success('Mark updated successfully');
            } else {
                await addMark(markData);
                toast.success('Mark added successfully');
            }

            // Reset form
            setScore('');
            setComment('');

            // Refresh marks
            fetchStudentMarks(selectedStudent.id);
        } catch (error) {
            console.error('Error saving mark:', error);
            toast.error('Failed to save mark');
        } finally {
            setSubmitting(false);
        }
    };

    const getSubjectName = (subjectId: string): string => {
        const subjectNames = [
            'Sinhala',
            'English',
            'Mathematics',
            'Science',
            'History',
            'Buddhism',
            'Health & Physical Education',
            'Art',
            'Tamil'
        ];
        
        // Check if it's a numeric ID (0, 1, 2, etc.)
        if (/^\d+$/.test(subjectId)) {
            const index = parseInt(subjectId, 10);
            if (index >= 0 && index < subjectNames.length) {
                return subjectNames[index];
            }
        }
        
        // Or use the subject by ID if found
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? subject.name : subjectId;
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Management</h3>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Grade:</label>
                <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((grade) => (
                        <option key={grade} value={grade}>
                            Grade {grade}
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <h4 className="font-medium text-gray-900 mb-3">Students</h4>
                    {loading ? (
                        <p>Loading students...</p>
                    ) : students.length === 0 ? (
                        <p>No students found in Grade {selectedGrade}</p>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden max-h-96 overflow-y-auto">
                            <ul className="divide-y divide-gray-200">
                                {students.map((student) => (
                                    <li 
                                        key={student.id}
                                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 ${
                                            selectedStudent?.id === student.id ? 'bg-blue-100' : ''
                                        }`}
                                        onClick={() => handleSelectStudent(student)}
                                    >
                                        <div className="font-medium">{student.name}</div>
                                        <div className="text-sm text-gray-500">{student.email}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                
                <div className="md:col-span-2">
                    {selectedStudent ? (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">
                                Marks for {selectedStudent.name}
                            </h4>
                            
                            {/* Add/Edit Mark Form */}
                            <div className="bg-gray-50 p-4 rounded-md mb-6">
                                <h5 className="font-medium text-gray-800 mb-2">Add/Edit Mark</h5>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                                            <select
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                required
                                            >
                                                <option value="">Select Subject</option>
                                                {subjects.map((subject) => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Score:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={score}
                                                onChange={(e) => setScore(e.target.value)}
                                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Year:</label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            >
                                                {availableYears.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Term:</label>
                                            <select
                                                value={selectedTerm}
                                                onChange={(e) => setSelectedTerm(e.target.value as Term)}
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            >
                                                <option value="Term 1">Term 1</option>
                                                <option value="Term 2">Term 2</option>
                                                <option value="Term 3">Term 3</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Comment:</label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            rows={2}
                                        ></textarea>
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {submitting ? 'Saving...' : 'Save Mark'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                            
                            {/* Display Marks */}
                            {studentMarks.length === 0 ? (
                                <p className="text-gray-500">No marks recorded yet.</p>
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {studentMarks.map(mark => (
                                                <tr key={mark.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getSubjectName(mark.subjectId)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            mark.score >= 75 ? 'bg-green-100 text-green-800' :
                                                            mark.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {mark.score}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {mark.term || determineTermFromDate(mark.timestamp)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {mark.year || new Date(mark.timestamp).getFullYear()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(mark.timestamp).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-gray-500">Select a student to view or enter marks.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StandaloneSubjectsComponent = () => {
    const [selectedGrade, setSelectedGrade] = useState<number>(1);
    
    return (
        <div>
            <div className="bg-white/20 p-4 mb-4 rounded-lg">
                <label className="block text-sm font-medium text-white mb-2">
                    Select Grade:
                </label>
                <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((grade) => (
                        <option key={grade} value={grade}>
                            Grade {grade}
                        </option>
                    ))}
                </select>
            </div>
            <SubjectManagement grade={selectedGrade} />
        </div>
    );
};

type TabType = 'marks' | 'subjects' | 'students' | 'registration';

const TeacherDashboard = () => {
    const [activeTab, setActiveTab] = useState<TabType>('marks');
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'marks':
                return <StandaloneMarksComponent />;
            case 'subjects':
                return <StandaloneSubjectsComponent />;
            case 'students':
                return <StudentManagement />;
            case 'registration':
                return <RegistrationTool />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800">
            {/* Header */}
            <header className="bg-blue-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-white text-2xl font-bold">Teacher Dashboard</h1>
                        {currentUser && (
                            <span className="text-blue-200 text-sm hidden md:inline-block">
                                Welcome, {currentUser.email}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-blue-700 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div>
                        {/* Tabs */}
                        <div className="border-b border-white/20">
                            <nav className="-mb-px flex space-x-6 md:space-x-8 overflow-x-auto">
                                <button
                                    data-tab="marks"
                                    onClick={() => setActiveTab('marks')}
                                    className={`${
                                        activeTab === 'marks'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Manage Marks
                                </button>
                                <button
                                    data-tab="students"
                                    onClick={() => setActiveTab('students')}
                                    className={`${
                                        activeTab === 'students'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Manage Students
                                </button>
                                <button
                                    data-tab="subjects"
                                    onClick={() => setActiveTab('subjects')}
                                    className={`${
                                        activeTab === 'subjects'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Manage Subjects
                                </button>
                                <button
                                    data-tab="registration"
                                    onClick={() => setActiveTab('registration')}
                                    className={`${
                                        activeTab === 'registration'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Registration Tool
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 md:p-6 border border-white/20">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard; 