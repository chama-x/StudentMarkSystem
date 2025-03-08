import React, { useEffect, useState } from 'react';
import { Student, Subject, Mark, ViewType, Term } from '../../types';
import { getSubjects, getStudentMarks, addMark, updateMark } from '../../services/realtimeDatabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MarkEntryProps {
    student: Student;
    grade: number;
}

const MarkEntry = ({ student, grade }: MarkEntryProps) => {
    const { currentUser } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [score, setScore] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedTerm, setSelectedTerm] = useState<Term>('Term 1');
    const [loading, setLoading] = useState(false);
    const [existingMarks, setExistingMarks] = useState<Mark[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [viewType, setViewType] = useState<ViewType>('term-wise');

    // Generate array of years (current year and 2 years back)
    const availableYears = Array.from({ length: 3 }, (_, i) => selectedYear - i);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fetchedSubjects, fetchedMarks] = await Promise.all([
                    getSubjects(grade),
                    getStudentMarks(student.id)
                ]);
                setSubjects(fetchedSubjects);
                setExistingMarks(fetchedMarks);
                
                // Reset form
                setSelectedSubject('');
                setScore('');
                setComment('');
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load subjects and marks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [grade, student.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSubject || !score || !currentUser) {
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
            
            const existingMark = existingMarks.find(
                mark => mark.subjectId === selectedSubject && determineTermFromDate(mark.timestamp) === selectedTerm
            );

            const markData = {
                studentId: student.id,
                subjectId: selectedSubject,
                grade,
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
            setSelectedSubject('');
            setScore('');
            setComment('');

            // Refresh marks
            const updatedMarks = await getStudentMarks(student.id);
            setExistingMarks(updatedMarks);
        } catch (error) {
            console.error('Error saving mark:', error);
            toast.error('Failed to save mark');
        } finally {
            setSubmitting(false);
        }
    };

    const determineTermFromDate = (timestamp: number): Term => {
        const date = new Date(timestamp);
        const month = date.getMonth();
        
        if (month >= 0 && month <= 3) return 'Term 1';
        if (month >= 4 && month <= 7) return 'Term 2';
        return 'Term 3';
    };

    const renderSubjectWiseView = () => (
        <div className="space-y-6">
            {subjects.map(subject => {
                const subjectMarks = existingMarks
                    .filter(mark => mark.subjectId === subject.id)
                    .sort((a, b) => b.timestamp - a.timestamp);
                
                if (subjectMarks.length === 0) return null;

                return (
                    <div key={subject.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900">{subject.name}</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
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
                                {subjectMarks.map((mark, index) => (
                                    <tr 
                                        key={mark.id}
                                        className={`hover:bg-gray-50 transition-colors duration-200 ${
                                            index === 0 ? 'bg-green-50' : ''
                                        }`}
                                    >
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
                                            {new Date(mark.timestamp).toLocaleDateString()}
                                            {index === 0 && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    Latest
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {mark.comment || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                    const termMarks = existingMarks.filter(mark => determineTermFromDate(mark.timestamp) === term);
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
                                                <tr key={`${term}-${subject.id}`} className="hover:bg-gray-50">
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
            <div className="p-6">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
                Enter Marks for {student.name}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                        Academic Year
                    </label>
                    <select
                        id="year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="term" className="block text-sm font-medium text-gray-700">
                        Term
                    </label>
                    <select
                        id="term"
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value as Term)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                    >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        Subject
                    </label>
                    <select
                        id="subject"
                        value={selectedSubject}
                        onChange={(e) => {
                            setSelectedSubject(e.target.value);
                            const existingMark = existingMarks.find(
                                mark => mark.subjectId === e.target.value && determineTermFromDate(mark.timestamp) === selectedTerm
                            );
                            if (existingMark) {
                                setScore(existingMark.score.toString());
                                setComment(existingMark.comment || '');
                            } else {
                                setScore('');
                                setComment('');
                            }
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                    >
                        <option value="">Select a subject</option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="score" className="block text-sm font-medium text-gray-700">
                        Score (0-100)
                    </label>
                    <input
                        type="number"
                        id="score"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                        Comment (Optional)
                    </label>
                    <textarea
                        id="comment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {submitting ? 'Saving...' : 'Save Mark'}
                    </button>
                </div>
            </form>

            {/* Existing Marks */}
            {existingMarks.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900">Existing Marks</h4>
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
                    {viewType === 'subject-wise' ? renderSubjectWiseView() : renderTermWiseView()}
                </div>
            )}
        </div>
    );
};

export default MarkEntry; 