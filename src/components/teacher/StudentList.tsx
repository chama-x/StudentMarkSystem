import { useEffect, useState } from 'react';
import { Student } from '../../types';
import { getStudentsByGrade, updateUser } from '../../services/realtimeDatabase';
import toast from 'react-hot-toast';

interface StudentListProps {
    grade: number;
    selectedStudent: Student | null;
    onSelectStudent: (student: Student) => void;
}

const StudentList = ({ grade, selectedStudent, onSelectStudent }: StudentListProps) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        grade: 1
    });

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const fetchedStudents = await getStudentsByGrade(grade);
                setStudents(fetchedStudents);
            } catch (error) {
                console.error('Error fetching students:', error);
                toast.error('Failed to load students');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [grade]);

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setEditForm({
            name: student.name,
            email: student.email,
            grade: student.grade
        });
    };

    const handleSave = async () => {
        if (!editingStudent) return;

        try {
            await updateUser(editingStudent.id, {
                name: editForm.name,
                email: editForm.email,
                grade: editForm.grade
            });

            // Update local state
            setStudents(students.map(student => 
                student.id === editingStudent.id 
                    ? { ...student, ...editForm }
                    : student
            ));

            setEditingStudent(null);
            toast.success('Student updated successfully');
        } catch (error) {
            console.error('Error updating student:', error);
            toast.error('Failed to update student');
        }
    };

    const handleCancel = () => {
        setEditingStudent(null);
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Students
                </label>
                <div className="relative rounded-md shadow-sm">
                    <input
                        type="text"
                        id="search"
                        className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Students in Grade {grade}
                </h3>
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Try adjusting your search terms or add new students.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                            <li
                                key={student.id}
                                className={`px-4 py-4 transition-colors duration-200 ${
                                    selectedStudent?.id === student.id 
                                        ? 'bg-indigo-50 border-l-4 border-indigo-500' 
                                        : ''
                                }`}
                            >
                                {editingStudent?.id === student.id ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Grade</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={editForm.grade}
                                                onChange={(e) => setEditForm({ ...editForm, grade: parseInt(e.target.value) })}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleSave}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div 
                                            className="flex items-center space-x-4 flex-1 cursor-pointer"
                                            onClick={() => onSelectStudent(student)}
                                        >
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <span className="text-indigo-600 font-medium">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {student.name}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(student);
                                                }}
                                                className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            {selectedStudent?.id === student.id && (
                                                <div className="text-indigo-600">
                                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default StudentList; 