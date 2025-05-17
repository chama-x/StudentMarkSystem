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

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (currentUser?.grade) {
                    const [fetchedMarks, fetchedSubjects] = await Promise.all([
                        getStudentMarks(currentUser.uid),
                        getSubjects(currentUser.grade)
                    ]);
                    setMarks(fetchedMarks);
                    setSubjects(fetchedSubjects);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load your marks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    if (loading) {
        return (
            <DashboardLayout title="Student Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">Loading your marks...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Student Dashboard">
            <div className="px-4 py-5 sm:px-6 space-y-6">
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