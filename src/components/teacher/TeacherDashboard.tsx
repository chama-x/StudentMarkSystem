import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Student, Subject, Mark } from '../../types';
import StudentList from './StudentList';
import MarkEntry from './MarkEntry';
import SubjectManagement from './SubjectManagement';
import StudentManagement from './StudentManagement';
import GenerateReport from './GenerateReport';
import { GRADES } from '../../constants/subjects';
import TeacherStats from './TeacherStats';
import { getStudentsByGrade, getStudentMarks, getSubjects } from '../../services/realtimeDatabase';
import { toast } from 'react-hot-toast';

type TabType = 'marks' | 'subjects' | 'students';

const TeacherDashboard = () => {
    const [selectedGrade, setSelectedGrade] = useState<number>(1);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('marks');
    const [students, setStudents] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log('TeacherDashboard: Starting data fetch for grade', selectedGrade);
                
                console.log('TeacherDashboard: Fetching students and subjects...');
                const [fetchedStudents, fetchedSubjects] = await Promise.all([
                    getStudentsByGrade(selectedGrade),
                    getSubjects(selectedGrade)
                ]);
                console.log('TeacherDashboard: Fetched students:', fetchedStudents);
                console.log('TeacherDashboard: Fetched subjects:', fetchedSubjects);
                
                setStudents(fetchedStudents);
                setSubjects(fetchedSubjects);

                // Fetch marks for all students
                console.log('TeacherDashboard: Fetching marks for all students...');
                const marksPromises = fetchedStudents.map(student => getStudentMarks(student.id));
                const allMarks = (await Promise.all(marksPromises)).flat();
                console.log('TeacherDashboard: Fetched all marks:', allMarks);
                
                setMarks(allMarks);
            } catch (error) {
                console.error('TeacherDashboard: Error fetching data:', error);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedGrade]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'marks':
                return (
                    <div className="space-y-4 md:space-y-6">
                        {/* Class Statistics */}
                        <TeacherStats
                            marks={marks}
                            subjects={subjects}
                            students={students}
                            grade={selectedGrade}
                        />
                        
                        {/* Report Generation */}
                        <div className="w-full">
                            <GenerateReport grade={selectedGrade} />
                        </div>
                        
                        {/* Student Management */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                            {/* Student List */}
                            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
                                <StudentList
                                    grade={selectedGrade}
                                    onSelectStudent={setSelectedStudent}
                                    selectedStudent={selectedStudent}
                                />
                            </div>

                            {/* Mark Entry Form */}
                            {selectedStudent && (
                                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                                    <MarkEntry
                                        student={selectedStudent}
                                        grade={selectedGrade}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'subjects':
                return (
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                        <SubjectManagement grade={selectedGrade} />
                    </div>
                );
            case 'students':
                return <StudentManagement />;
            default:
                return null;
        }
    };

    return (
        <DashboardLayout title="Teacher Dashboard">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">Loading...</div>
                </div>
            ) : (
                <div className="teacher-dashboard-bg min-h-screen">
                    <div className="teacher-dashboard-content space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                        {/* Grade Selection */}
                        <div className="bg-white/30 backdrop-blur-lg shadow-lg rounded-lg p-4 md:p-6 border border-white/20">
                            <div className="max-w-xs">
                                <label htmlFor="grade" className="block text-sm font-medium text-white">
                                    Select Grade
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <select
                                        id="grade"
                                        value={selectedGrade}
                                        onChange={(e) => {
                                            setSelectedGrade(Number(e.target.value));
                                            setSelectedStudent(null);
                                        }}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-white/20 bg-white/10 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors duration-200"
                                    >
                                        {GRADES.map((grade) => (
                                            <option key={grade} value={grade} className="bg-blue-900 text-white">
                                                Grade {grade}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-white/20">
                            <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('marks')}
                                    className={`${
                                        activeTab === 'marks'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Student Marks
                                </button>
                                <button
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
                                    onClick={() => setActiveTab('subjects')}
                                    className={`${
                                        activeTab === 'subjects'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Manage Subjects
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 md:p-6 border border-white/20">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeacherDashboard; 