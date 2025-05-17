import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import { getStudentMarks, getSubjects } from '../../services/realtimeDatabase';
import { Mark, Subject, ViewType, Term } from '../../types';
import { toast } from 'react-hot-toast';
import StudentStats from './StudentStats';

const StudentDashboard = () => {
    const { currentUser } = useAuth();
    const [marks, setMarks] = useState<Mark[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<ViewType>('term-wise');

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('StudentDashboard: Starting data fetch');
                console.log('StudentDashboard: Current user:', currentUser);
                
                if (currentUser?.grade) {
                    console.log('StudentDashboard: Fetching marks and subjects for grade', currentUser.grade);
                    const [fetchedMarks, fetchedSubjects] = await Promise.all([
                        getStudentMarks(currentUser.uid),
                        getSubjects(currentUser.grade)
                    ]);
                    console.log('StudentDashboard: Fetched marks:', fetchedMarks);
                    console.log('StudentDashboard: Fetched subjects:', fetchedSubjects);
                    
                    setMarks(fetchedMarks);
                    setSubjects(fetchedSubjects);
                } else {
                    console.log('StudentDashboard: No grade found for current user');
                }
            } catch (error) {
                console.error('StudentDashboard: Error fetching data:', error);
                toast.error('Failed to load your marks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);


    const determineTermFromDate = (timestamp: number): Term => {
        const date = new Date(timestamp);
        const month = date.getMonth();
        const terms = {
            'Term 1': [0, 1, 2, 3],     // Jan-Apr
            'Term 2': [4, 5, 6, 7],     // May-Aug
            'Term 3': [8, 9, 10, 11]    // Sep-Dec
        };
        
        for (const [term, months] of Object.entries(terms)) {
            if (months.includes(month)) {
                return term as Term;
            }
        }
        return 'Term 1'; // Default to Term 1
    };

    const renderSubjectWiseView = () => (
        <div className="space-y-6">
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
    );

    const renderTermWiseView = () => {
        const terms: Term[] = ['Term 1', 'Term 2', 'Term 3'];
        
        return (
            <div className="space-y-8">
                {terms.map(term => {
                    const termMarks = marks.filter(mark => determineTermFromDate(mark.timestamp) === term);
                    if (termMarks.length === 0) return null;

                    return (
                        <div key={term} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">{term}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Subject
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Score
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Comments
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {subjects.map(subject => {
                                            const subjectMark = termMarks
                                                .filter(mark => mark.subjectId === subject.id)
                                                .sort((a, b) => b.timestamp - a.timestamp)[0];
                                            
                                            if (!subjectMark) return null;

                                            return (
                                                <tr key={`${term}-${subject.id}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {subject.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            subjectMark.score >= 75 ? 'bg-green-100 text-green-800' :
                                                            subjectMark.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {subjectMark.score}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(subjectMark.timestamp).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {subjectMark.comment || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
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

    return (
        <DashboardLayout title="Student Dashboard">
            <div className="px-4 py-5 sm:px-6 space-y-6">
                {/* Stats Overview */}
                <StudentStats marks={marks} subjects={subjects} />

                {/* Academic Records */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Your Academic Records
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Grade {currentUser?.grade} - All Subjects
                            </p>
                        </div>
                        
                        {/* View Selector */}
                        <div className="mt-4 sm:mt-0">
                            <div className="inline-flex rounded-md shadow-sm">
                                <button
                                    onClick={() => setViewType('term-wise')}
                                    className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium ${
                                        viewType === 'term-wise'
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    Term-wise
                                </button>
                                <button
                                    onClick={() => setViewType('subject-wise')}
                                    className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium ${
                                        viewType === 'subject-wise'
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    Subject-wise
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        {marks.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No marks available</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Your academic records will appear here once your teachers start adding marks.
                                </p>
                            </div>
                        ) : (
                            viewType === 'subject-wise' ? renderSubjectWiseView() : renderTermWiseView()
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard; 