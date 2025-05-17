import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Mark, Subject, Student } from '../../types';

interface TeacherStatsProps {
    marks: Mark[];
    subjects: Subject[];
    students: Student[];
    grade: number;
}

interface PerformanceDistribution {
    [key: string]: number;
}

const TeacherStats: React.FC<TeacherStatsProps> = ({ marks, subjects, students, grade }) => {
    // Calculate class statistics

    // Average scores by subject
    const subjectAverages = subjects.map(subject => {
        const subjectMarks = marks.filter(mark => mark.subjectId === subject.id);
        const average = subjectMarks.reduce((sum, mark) => sum + mark.score, 0) / subjectMarks.length;
        return {
            subject: subject.name,
            average: Math.round(average * 10) / 10 || 0
        };
    });

    // Performance distribution
    const performanceDistribution = marks.reduce((acc: PerformanceDistribution, mark) => {
        let category;
        if (mark.score >= 75) category = 'Excellent (≥75)';
        else if (mark.score >= 50) category = 'Average (50-74)';
        else category = 'Needs Help (<50)';

        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {} as PerformanceDistribution);

    const pieChartData = Object.entries(performanceDistribution).map(([name, value]) => ({
        name,
        value
    }));

    const CUTE_COLORS = [
        '#FF9999', // Soft Red
        '#99FF99', // Soft Green
        '#9999FF', // Soft Blue
        '#FFFF99', // Soft Yellow
        '#FF99FF'  // Soft Pink
    ];

    return (
        <div className="space-y-8 p-4 bg-white rounded-lg shadow">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Class Performance Overview - Grade {grade}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subject Averages */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Subject Averages</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectAverages}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar
                                        dataKey="average"
                                        fill="#8b5cf6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Performance Distribution */}
                    <div className="bg-gradient-to-br from-pink-50 to-red-50 p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Performance Distribution</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CUTE_COLORS[index % CUTE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">Class Average</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {Math.round(marks.reduce((sum, mark) => sum + mark.score, 0) / marks.length)}%
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">Total Students</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {students.length}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">Assessments</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {marks.length}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-yellow-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">High Performers</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {marks.filter(mark => mark.score >= 75).length}
                    </p>
                </div>
            </div>

            {/* Students Needing Attention */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Students Needing Attention</h4>
                <div className="space-y-2">
                    {students.map(student => {
                        const studentMarks = marks.filter(mark => mark.studentId === student.id);
                        const average = studentMarks.reduce((sum, mark) => sum + mark.score, 0) / studentMarks.length;
                        if (average < 50 && studentMarks.length > 0) {
                            return (
                                <div key={student.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                                    <span className="text-sm text-red-600 font-medium">{Math.round(average)}%</span>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
};

export default TeacherStats; 