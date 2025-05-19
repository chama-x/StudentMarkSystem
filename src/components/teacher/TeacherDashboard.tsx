import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentManagement from './StudentManagement';
import RegistrationTool from './RegistrationTool';
import SubjectManagement from './SubjectManagement';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';
import { Student, Mark } from '../../types';

// Create standalone versions for the dashboard
const StandaloneMarksComponent = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedGrade, setSelectedGrade] = useState<number>(1);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentMarks, setStudentMarks] = useState<Mark[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, [selectedGrade]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);
            const usersData = snapshot.val() || {};
            
            const studentsList = Object.entries(usersData)
                .filter(entry => {
                    const user = entry[1] as any;
                    return user.role === 'student' && Number(user.grade) === selectedGrade;
                })
                .map(entry => {
                    const id = entry[0];
                    const user = entry[1] as any;
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
            
            const marksRef = ref(database, 'marks');
            const snapshot = await get(marksRef);
            const marksData = snapshot.val() || {};
            
            const studentMarks = Object.entries(marksData)
                .filter(([_, value]) => (value as any).studentId === studentId)
                .map(([key, value]) => ({
                    id: key,
                    ...(value as any)
                }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            setStudentMarks(studentMarks);
        } catch (error) {
            console.error('Error fetching marks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        fetchStudentMarks(student.id);
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
                        <div className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {studentMarks.map(mark => (
                                                <tr key={mark.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {mark.subjectId}
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
                                                        {mark.term || 'Unknown Term'}
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