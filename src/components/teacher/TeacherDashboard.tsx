import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentManagement from './StudentManagement';
import RegistrationTool from './RegistrationTool';

type TabType = 'marks' | 'subjects' | 'students' | 'registration';

const TeacherDashboard = () => {
    const [activeTab, setActiveTab] = useState<TabType>('students');
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'marks':
                return <div>Mark Management Component</div>;
            case 'subjects':
                return <div>Subject Management Component</div>;
            case 'students':
                return <StudentManagement />;
            case 'registration':
                return <RegistrationTool />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800">
            {/* Header */}
            <header className="bg-blue-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-white text-2xl font-bold">Teacher Dashboard</h1>
                        {currentUser && (
                            <span className="text-blue-200 text-sm hidden md:inline-block">
                                Welcome, {currentUser.email}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-blue-700 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div>
                        {/* Tabs */}
                        <div className="border-b border-white/20">
                            <nav className="-mb-px flex space-x-6 md:space-x-8 overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab('students')}
                                    className={`${
                                        activeTab === 'students'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Manage Students
                                </button>
                                <button
                                    onClick={() => setActiveTab('marks')}
                                    className={`${
                                        activeTab === 'marks'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Manage Marks
                                </button>
                                <button
                                    onClick={() => setActiveTab('subjects')}
                                    className={`${
                                        activeTab === 'subjects'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Manage Subjects
                                </button>
                                <button
                                    onClick={() => setActiveTab('registration')}
                                    className={`${
                                        activeTab === 'registration'
                                            ? 'border-white text-white'
                                            : 'border-transparent text-blue-100 hover:text-white hover:border-white/50'
                                    } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                                >
                                    Registration Tool
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 md:p-6 border border-white/20">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard; 