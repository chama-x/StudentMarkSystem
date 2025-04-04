import React, { useState, useEffect } from 'react';
import { database } from '../../firebase';
import { toast } from 'react-hot-toast';
import { GRADES } from '../../constants/subjects';
import { ref, get, remove, push, set } from 'firebase/database';
import { Student, User, UserRole } from '../../types';

interface StudentFormData {
    name: string;
    email: string;
    grade: number;
    password: string;
}

interface DatabaseUser {
    role: string;
    name: string;
    email: string;
    grade: number;
}

interface DatabaseMark {
    studentId: string;
}

const StudentManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [deletingStudents, setDeletingStudents] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState<StudentFormData>({
        name: '',
        email: '',
        grade: 1,
        password: 'Student@123' // Default password with option to change
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
                .filter(entry => {
                    const user = entry[1] as DatabaseUser;
                    return user.role === 'student';
                })
                .map(entry => {
                    const id = entry[0];
                    const user = entry[1] as DatabaseUser;
                    // Ensure grade is a number
                    const grade = user.grade !== undefined ? Number(user.grade) : 1;
                    
                    console.log(`Student ${user.name} has grade: ${grade} (original: ${user.grade}, type: ${typeof user.grade})`);
                    
                    return {
                        id,
                        name: user.name,
                        email: user.email,
                        grade: grade // Ensure it's a number
                    };
                })
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
        setAdding(true);
        
        try {
            // Ensure grade is a number
            const gradeNumber = Number(formData.grade);
            
            // Generate a unique ID for the student
            const newStudentRef = push(ref(database, 'users'));
            const newStudentId = newStudentRef.key!;
            
            // Create the new student object
            const newStudent: User = {
                uid: newStudentId,
                email: formData.email,
                name: formData.name,
                role: 'student' as UserRole,
                grade: gradeNumber // Ensure it's a number
            };

            console.log('Adding student with grade:', gradeNumber);

            // Save the student without changing auth state
            await set(newStudentRef, newStudent);
            
            // Also save to pendingRegistrations collection for later completion
            const pendingRef = ref(database, `pendingRegistrations/${newStudentId}`);
            await set(pendingRef, {
                email: formData.email,
                password: formData.password,
                timestamp: Date.now()
            });
            
            // Update local state
            setStudents(prev => [...prev, {
                id: newStudentId,
                name: formData.name,
                email: formData.email,
                grade: gradeNumber // Ensure it's a number
            }]);
            
            toast.success('Student added successfully');
            setIsModalOpen(false);
            setFormData({ 
                name: '', 
                email: '', 
                grade: 1, 
                password: 'Student@123' 
            });
            
            // Force a complete refresh of the list to ensure all data is properly loaded
            await fetchStudents();
        } catch (error) {
            console.error('Error adding student:', error);
            toast.error('Failed to add student');
        } finally {
            setAdding(false);
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
                .filter(entry => {
                    const mark = entry[1] as DatabaseMark;
                    return mark.studentId === studentId;
                })
                .map(entry => {
                    const markId = entry[0];
                    return remove(ref(database, `marks/${markId}`));
                });

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

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <input
                                        type="text"
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Default password is Student@123. You can change it if needed.
                                    </p>
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
                                        disabled={adding}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {adding ? 'Adding...' : 'Add Student'}
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