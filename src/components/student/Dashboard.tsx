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
        bestSubject: { name: 'Unknown Subject', score: 0 }
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

                // Calculate statistics
                if (fetchedMarks.length > 0 && fetchedSubjects.length > 0) {
                    calculateStats(fetchedMarks, fetchedSubjects);
                }
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

    const calculateStats = (fetchedMarks: Mark[], fetchedSubjects: Subject[]) => {
        try {
            // Group marks by subject and get the latest mark for each subject
            const subjectMap = new Map<string, { latestMark: Mark, subject: Subject | undefined }>();
            
            // Initialize each subject with empty data
            fetchedSubjects.forEach(subject => {
                subjectMap.set(subject.id, { latestMark: {} as Mark, subject });
            });
            
            // Fill in the latest mark for each subject
            fetchedMarks.forEach(mark => {
                const existing = subjectMap.get(mark.subjectId);
                if (!existing || !existing.latestMark.timestamp || mark.timestamp > existing.latestMark.timestamp) {
                    const subject = fetchedSubjects.find(s => s.id === mark.subjectId);
                    subjectMap.set(mark.subjectId, { 
                        latestMark: mark, 
                        subject 
                    });
                }
            });
            
            // Calculate overall average from latest marks
            let totalScore = 0;
            let countedSubjects = 0;
            let bestSubjectScore = 0;
            let bestSubjectName = 'Unknown Subject';
            
            subjectMap.forEach(({ latestMark, subject }) => {
                if (latestMark.score !== undefined) {
                    totalScore += latestMark.score;
                    countedSubjects++;
                    
                    if (latestMark.score > bestSubjectScore) {
                        bestSubjectScore = latestMark.score;
                        bestSubjectName = subject?.name || 'Unknown Subject';
                    }
                }
            });
            
            const overallAverage = countedSubjects > 0 ? Math.round(totalScore / countedSubjects) : 0;
            
            setStats({
                overallAverage,
                bestSubject: { 
                    name: bestSubjectName, 
                    score: bestSubjectScore 
                }
            });
            
            console.log('Calculated stats:', { 
                overallAverage, 
                bestSubject: { name: bestSubjectName, score: bestSubjectScore } 
            });
        } catch (error) {
            console.error('Error calculating stats:', error);
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
                
                {/* Performance Summary */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Overall Average</h3>
                                    <div className="mt-2 text-3xl font-semibold text-indigo-600">
                                        {stats.overallAverage}%
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Based on your latest marks
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Best Subject</h3>
                                    <div className="mt-2 text-3xl font-semibold text-green-600">
                                        {stats.bestSubject.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Score: {stats.bestSubject.score}%
                                    </div>
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