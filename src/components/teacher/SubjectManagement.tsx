import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Subject } from '../../types';
import { getSubjects, addSubject, updateSubject, deleteSubject } from '../../services/realtimeDatabase';

interface SubjectManagementProps {
    grade: number;
}

const SubjectManagement: React.FC<SubjectManagementProps> = ({ grade }) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    useEffect(() => {
        fetchSubjects();
    }, [grade]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const fetchedSubjects = await getSubjects(grade);
            setSubjects(fetchedSubjects);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            toast.error('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim()) {
            toast.error('Please enter a subject name');
            return;
        }

        try {
            await addSubject({
                name: newSubjectName.trim(),
                grade
            });
            toast.success('Subject added successfully');
            setNewSubjectName('');
            fetchSubjects();
        } catch (error) {
            console.error('Error adding subject:', error);
            toast.error('Failed to add subject');
        }
    };

    const handleUpdateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubject || !editingSubject.name.trim()) {
            toast.error('Please enter a subject name');
            return;
        }

        try {
            await updateSubject(editingSubject.id, {
                name: editingSubject.name.trim(),
                grade
            });
            toast.success('Subject updated successfully');
            setEditingSubject(null);
            fetchSubjects();
        } catch (error) {
            console.error('Error updating subject:', error);
            toast.error('Failed to update subject');
        }
    };

    const handleDeleteSubject = async (subjectId: string) => {
        if (!confirm('Are you sure you want to delete this subject? This will also delete all associated marks.')) {
            return;
        }

        try {
            await deleteSubject(subjectId);
            toast.success('Subject deleted successfully');
            fetchSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
            toast.error('Failed to delete subject');
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-600">Loading subjects...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manage Subjects - Grade {grade}
            </h3>

            {/* Add Subject Form */}
            <form onSubmit={handleAddSubject} className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="Enter new subject name"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Add Subject
                    </button>
                </div>
            </form>

            {/* Subjects List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {subjects.map((subject) => (
                        <li key={subject.id} className="px-4 py-4">
                            {editingSubject?.id === subject.id ? (
                                <form onSubmit={handleUpdateSubject} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editingSubject.name}
                                        onChange={(e) => setEditingSubject({
                                            ...editingSubject,
                                            name: e.target.value
                                        })}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingSubject(null)}
                                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-900">{subject.name}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingSubject(subject)}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSubject(subject.id)}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SubjectManagement; 