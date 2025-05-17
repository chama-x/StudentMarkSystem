import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts';
import { Mark, Subject } from '../../types';

interface StudentStatsProps {
    marks: Mark[];
    subjects: Subject[];
}

const StudentStats: React.FC<StudentStatsProps> = ({ marks, subjects }) => {
    // Handle empty marks case
    if (marks.length === 0) {
        return (
            <div className="space-y-8 p-4 bg-white rounded-lg shadow">
                <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Marks Available</h3>
                    <p className="text-sm text-gray-500">Your academic statistics will appear here once marks are added.</p>
                </div>
            </div>
        );
    }

    // Prepare data for charts
    const getSubjectName = (subjectId: string) => {
        return subjects.find(subject => subject.id === subjectId)?.name || 'Unknown Subject';
    };

    // Latest scores for radar chart
    const radarData = subjects.map(subject => {
        const subjectMarks = marks.filter(mark => mark.subjectId === subject.id)
            .sort((a, b) => b.timestamp - a.timestamp);
        return {
            subject: subject.name,
            score: subjectMarks[0]?.score || 0
        };
    });

    // Progress over time for line chart
    const lineChartData = marks.reduce((acc: any[], mark) => {
        if (!mark?.subjectId) return acc; // Skip if subjectId is missing
        const date = new Date(mark.timestamp).toLocaleDateString();
        const subjectName = getSubjectName(mark.subjectId);
        const existingEntry = acc.find(entry => entry.date === date);
        if (existingEntry) {
            existingEntry[subjectName] = mark.score;
        } else {
            acc.push({
                date,
                [subjectName]: mark.score
            });
        }
        return acc;
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Average scores by subject for bar chart
    const barChartData = subjects.map(subject => {
        const subjectMarks = marks.filter(mark => mark.subjectId === subject.id);
        const average = subjectMarks.length > 0 
            ? subjectMarks.reduce((sum, mark) => sum + mark.score, 0) / subjectMarks.length 
            : 0;
        return {
            subject: subject.name,
            average: Math.round(average * 10) / 10
        };
    });

    const CUTE_COLORS = [
        '#FF9999', // Soft Red
        '#99FF99', // Soft Green
        '#9999FF', // Soft Blue
        '#FFFF99', // Soft Yellow
        '#FF99FF', // Soft Pink
        '#99FFFF', // Soft Cyan
        '#FFB366', // Soft Orange
        '#B366FF', // Soft Purple
        '#66FFB3', // Soft Mint
        '#FF66B3'  // Soft Rose
    ];

    return (
        <div className="space-y-8 p-4 bg-white rounded-lg shadow">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Your Academic Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Radar Chart - Current Performance */}
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Current Performance</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar
                                        name="Score"
                                        dataKey="score"
                                        stroke="#8b5cf6"
                                        fill="#8b5cf6"
                                        fillOpacity={0.5}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Line Chart - Progress Over Time */}
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Progress Over Time</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    {subjects.map((subject, index) => (
                                        <Line
                                            key={subject.id}
                                            type="monotone"
                                            dataKey={subject.name}
                                            stroke={CUTE_COLORS[index % CUTE_COLORS.length]}
                                            strokeWidth={2}
                                            dot={{ fill: CUTE_COLORS[index % CUTE_COLORS.length] }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart - Average Scores */}
                    <div className="bg-gradient-to-br from-yellow-50 to-red-50 p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Average Scores</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar
                                        dataKey="average"
                                        fill="#f472b6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">Overall Average</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {Math.round(marks.reduce((sum, mark) => sum + mark.score, 0) / marks.length)}%
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">Best Subject</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {getSubjectName(marks.reduce((best, mark) => mark.score > best.score ? mark : best, marks[0]).subjectId)}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">Total Assessments</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {marks.length}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-yellow-50 p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700">Recent Improvement</h4>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                        {marks.length > 1 && marks[0].score > marks[1].score ? '↑' : '↓'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentStats; 