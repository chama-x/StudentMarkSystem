import React, { useState } from 'react';
import { Mark, Student, Subject } from '../../types';
import { getStudentMarks, getStudentsByGrade, getSubjects } from '../../services/realtimeDatabase';
import { toast } from 'react-hot-toast';

interface GenerateReportProps {
    grade: number;
}

const getGradeFromScore = (score: number): string => {
    if (score >= 75) return 'A';
    if (score >= 65) return 'B';
    if (score >= 55) return 'C';
    if (score >= 35) return 'S';
    return 'F';
};

const GenerateReport: React.FC<GenerateReportProps> = ({ grade }) => {
    const [loading, setLoading] = useState(false);

    const generateHTML = (students: Student[], marks: Mark[], subjects: Subject[]) => {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Academic Report - Grade ${grade}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #f8f9fa;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .student-section {
                        margin-bottom: 40px;
                    }
                    .score-high { color: #059669; }
                    .score-medium { color: #b45309; }
                    .score-low { color: #dc2626; }
                    .grade-legend {
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    }
                    .grade-legend h4 {
                        margin-top: 0;
                        margin-bottom: 10px;
                    }
                    .grade-legend ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 20px;
                    }
                    .grade-legend li {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .grade-badge {
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                    }
                    .grade-A { background-color: #dcfce7; color: #166534; }
                    .grade-B { background-color: #dbeafe; color: #1e40af; }
                    .grade-C { background-color: #fef9c3; color: #854d0e; }
                    .grade-S { background-color: #ffedd5; color: #9a3412; }
                    .grade-F { background-color: #fee2e2; color: #991b1b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Academic Performance Report</h1>
                    <h2>Grade ${grade}</h2>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>

                <div class="grade-legend">
                    <h4>Grading Scale</h4>
                    <ul>
                        <li><span class="grade-badge grade-A">A</span> 75-100 Excellent</li>
                        <li><span class="grade-badge grade-B">B</span> 65-74 Very Good</li>
                        <li><span class="grade-badge grade-C">C</span> 55-64 Good</li>
                        <li><span class="grade-badge grade-S">S</span> 35-54 Pass</li>
                        <li><span class="grade-badge grade-F">F</span> 0-34 Fail</li>
                    </ul>
                </div>
                
                ${students.map(student => {
                    const studentMarks = marks.filter(m => m.studentId === student.id);
                    return `
                        <div class="student-section">
                            <h3>${student.name}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Grade</th>
                                        <th>Year</th>
                                        <th>Term</th>
                                        <th>Comments</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subjects.map(subject => {
                                        const mark = studentMarks.find(m => m.subjectId === subject.id);
                                        if (!mark) return '';
                                        const letterGrade = getGradeFromScore(mark.score);
                                        const scoreClass = mark.score >= 75 ? 'score-high' : 
                                                         mark.score >= 55 ? 'score-medium' : 'score-low';
                                        return `
                                            <tr>
                                                <td>${subject.name}</td>
                                                <td class="${scoreClass}">${mark.score}</td>
                                                <td><span class="grade-badge grade-${letterGrade}">${letterGrade}</span></td>
                                                <td>${mark.year}</td>
                                                <td>${mark.term}</td>
                                                <td>${mark.comment || '-'}</td>
                                                <td>${new Date(mark.timestamp).toLocaleDateString()}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }).join('')}
            </body>
            </html>
        `;
        return html;
    };

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            
            // Fetch all necessary data
            const [students, subjects] = await Promise.all([
                getStudentsByGrade(grade),
                getSubjects(grade)
            ]);

            // Fetch marks for all students
            const marksPromises = students.map(student => getStudentMarks(student.id));
            const marksArrays = await Promise.all(marksPromises);
            const marks = marksArrays.flat();

            // Generate HTML
            const html = generateHTML(students, marks, subjects);

            // Create blob and download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `academic-report-grade-${grade}-${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        Generate Report
                    </h3>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Download a detailed academic report for Grade {grade}
                    </p>
                </div>
                <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="btn btn-primary w-full sm:w-auto min-w-[140px]"
                >
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>
        </div>
    );
};

export default GenerateReport; 