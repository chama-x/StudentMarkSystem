import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import { Mark, Subject } from '../../types';
import { getStudentMarks, getSubjects } from '../../services/realtimeDatabase';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [marks, setMarks] = useState<Mark[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        overallAverage: 0,
        bestSubject: { name: '', score: 0 }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Student Dashboard: Current user:', currentUser);
                setLoading(true);
                setError(null);
                
                if (!currentUser) {
                    setError('No user data available');
                    return;
                }
                
                if (!currentUser.uid) {
                    setError('User ID is missing');
                    return;
                }
                
                if (!currentUser.grade) {
                    setError('Grade information is missing');
                    console.error('Student is missing grade:', currentUser);
                    return;
                }
                
                console.log(`Fetching data for student: ${currentUser.name}, Grade: ${currentUser.grade}`);
                
                // Fetch marks and subjects in parallel
                const [fetchedMarks, fetchedSubjects] = await Promise.all([
                    getStudentMarks(currentUser.uid),
                    getSubjects(currentUser.grade)
                ]);
                
                console.log('Fetched marks:', fetchedMarks.length);
                console.log('Fetched subjects:', fetchedSubjects.length);
                
                setMarks(fetchedMarks);
                setSubjects(fetchedSubjects);
                
                if (fetchedMarks.length === 0) {
                    console.log('No marks found for student');
                }
                
                if (fetchedSubjects.length === 0) {
                    console.log('No subjects found for grade', currentUser.grade);
                }

                // Calculate statistics from fetched marks
                calculateStatistics(fetchedMarks, fetchedSubjects);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load your marks');
                toast.error('Failed to load your marks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Calculate overall average and best subject
    const calculateStatistics = (studentMarks: Mark[], allSubjects: Subject[]) => {
        if (studentMarks.length === 0) {
            setStats({
                overallAverage: 0,
                bestSubject: { name: 'No data available', score: 0 }
            });
            return;
        }

        try {
            // Create a map to look up subject names by ID
            const subjectMap: Record<string, string> = {};
            allSubjects.forEach(subject => {
                subjectMap[subject.id] = subject.name;
            });

            // Get the latest mark for each subject
            const latestMarksBySubject: Record<string, Mark> = {};
            
            studentMarks.forEach(mark => {
                const existingMark = latestMarksBySubject[mark.subjectId];
                if (!existingMark || mark.timestamp > existingMark.timestamp) {
                    latestMarksBySubject[mark.subjectId] = mark;
                }
            });

            // Get array of latest marks
            const latestMarks = Object.values(latestMarksBySubject);
            
            // Calculate average score
            let totalScore = 0;
            let markCount = 0;
            let bestScore = 0;
            let bestSubjectId = '';
            
            for (const mark of latestMarks) {
                if (typeof mark.score === 'number') {
                    totalScore += mark.score;
                    markCount++;
                    
                    if (mark.score > bestScore) {
                        bestScore = mark.score;
                        bestSubjectId = mark.subjectId;
                    }
                }
            }
            
            const averageScore = markCount > 0 ? totalScore / markCount : 0;
            const bestSubjectName = bestSubjectId ? (subjectMap[bestSubjectId] || 'Unknown Subject') : 'No data available';
            
            setStats({
                overallAverage: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
                bestSubject: { 
                    name: bestSubjectName, 
                    score: bestScore
                }
            });
        } catch (error) {
            console.error('Error calculating statistics:', error);
            setStats({
                overallAverage: 0,
                bestSubject: { name: 'Error calculating', score: 0 }
            });
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Student Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">Loading your marks...</div>
                </div>
            </DashboardLayout>
        );
    }
    
    if (error) {
        return (
            <DashboardLayout title="Student Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-600">Error: {error}</div>
                </div>
            </DashboardLayout>
        );
    }
    
    if (!currentUser?.grade) {
        return (
            <DashboardLayout title="Student Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-yellow-600">
                        Your grade information is missing. Please contact your teacher.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (marks.length === 0) {
        return (
            <DashboardLayout title="Student Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">
                        No marks available yet. Your teacher will add them soon.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Student Dashboard">
            <div className="px-4 py-5 sm:px-6 space-y-6">
                {/* Student Info */}
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                    <h3 className="text-lg font-medium text-blue-800">Your Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                        <p><span className="font-medium">Name:</span> {currentUser.name}</p>
                        <p><span className="font-medium">Grade:</span> {currentUser.grade}</p>
                        <p><span className="font-medium">Email:</span> {currentUser.email}</p>
                    </div>
                </div>

                {/* Academic Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Overall Average
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">
                                                {stats.overallAverage}%
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Best Subject
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">
                                                {stats.bestSubject.name} ({stats.bestSubject.score}%)
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Student Marks */}
                <div className="mt-8 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Your Academic Progress</h2>
                    
                    {subjects.map(subject => {
                        const subjectMarks = marks
                            .filter(mark => mark.subjectId === subject.id)
                            .sort((a, b) => b.timestamp - a.timestamp);
                        
                        if (subjectMarks.length === 0) return null;

                        const latestMark = subjectMarks[0];
                        const hasImproved = subjectMarks.length > 1 && 
                            latestMark.score > subjectMarks[1].score;

                        return (
                            <div key={subject.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-gray-900">{subject.name}</h3>
                                    {hasImproved && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Improving
                                        </span>
                                    )}
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {subjectMarks.map((mark, index) => (
                                        <div 
                                            key={mark.id}
                                            className={`px-4 py-4 sm:px-6 ${
                                                index === 0 ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                                        mark.score >= 75 ? 'bg-green-100 text-green-800' :
                                                        mark.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {mark.score}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(mark.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {mark.comment && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    {mark.comment}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard; 