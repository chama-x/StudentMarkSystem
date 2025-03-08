import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../firebase';
import { createUser, updateUser, getUser } from '../../services/realtimeDatabase';
import { toast } from 'react-hot-toast';
import { GRADES } from '../../constants/subjects';
import { ref, get, remove } from 'firebase/database';
import { Student } from '../../types';

interface StudentFormData {
    name: string;
    email: string;
    grade: number;
}

const StudentManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingStudents, setDeletingStudents] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState<StudentFormData>({
        name: '',
        email: '',
        grade: 1
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);
            const usersData = snapshot.val() || {};
            
            const studentsList = Object.entries(usersData)
                .filter(([_, user]: [string, any]) => user.role === 'student')
                .map(([id, user]: [string, any]) => ({
                    id,
                    name: user.name,
                    email: user.email,
                    grade: user.grade
                }))
                .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));

            setStudents(studentsList);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate a password based on student's name
            const password = `${formData.name.split(' ')[0]}@123`;

            // Create Firebase auth account
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);

            // Create user data in database
            const newStudent = {
                uid: userCredential.user.uid,
                email: formData.email,
                name: formData.name,
                role: 'student',
                grade: formData.grade
            };

            await createUser(userCredential.user.uid, newStudent);

            // Update local state
            setStudents(prevStudents => [...prevStudents, {
                id: userCredential.user.uid,
                name: formData.name,
                email: formData.email,
                grade: formData.grade
            }].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name)));

            toast.success('Student added successfully');
            toast.success(`Password: ${password}`);
            setIsModalOpen(false);
            setFormData({ name: '', email: '', grade: 1 });
        } catch (error: any) {
            console.error('Error adding student:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Email is already registered');
            } else {
                toast.error('Failed to add student');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (studentId: string, studentEmail: string) => {
        if (!confirm(`Are you sure you want to delete student ${studentEmail}? This will also delete all their marks.`)) {
            return;
        }

        setDeletingStudents(prev => new Set(prev).add(studentId));

        try {
            // Delete user data from database
            await remove(ref(database, `users/${studentId}`));
            
            // Delete associated marks
            const marksRef = ref(database, 'marks');
            const marksSnapshot = await get(marksRef);
            const marks = marksSnapshot.val() || {};
            
            // Delete marks for this student
            const deletePromises = Object.entries(marks)
                .filter(([_, mark]) => (mark as any).studentId === studentId)
                .map(([markId]) => remove(ref(database, `marks/${markId}`)));

            await Promise.all(deletePromises);

            // Update local state
            setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
            toast.success('Student deleted successfully');
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('Failed to delete student');
        } finally {
            setDeletingStudents(prev => {
                const newSet = new Set(prev);
                newSet.delete(studentId);
                return newSet;
            });
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        Student Management
                    </h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add New Student
                    </button>
                </div>

                {/* Students List */}
                {loading ? (
                    <div className="text-center py-4">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No students found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Grade
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((student) => (
                                    <tr key={student.id} className={deletingStudents.has(student.id) ? 'opacity-50 bg-gray-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {student.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {student.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                Grade {student.grade}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteStudent(student.id, student.email)}
                                                disabled={deletingStudents.has(student.id)}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deletingStudents.has(student.id) ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add Student Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Add New Student
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                                        Grade
                                    </label>
                                    <select
                                        id="grade"
                                        value={formData.grade}
                                        onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    >
                                        {GRADES.map((grade) => (
                                            <option key={grade} value={grade}>
                                                Grade {grade}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Adding...' : 'Add Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentManagement; 