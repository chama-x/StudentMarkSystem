import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import SchoolLogo from '../common/SchoolLogo';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            toast.success('Logged out successfully');
        } catch {
            toast.error('Failed to log out');
        }
    };

    const isTeacher = currentUser?.role === 'teacher';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* School Logo and Name */}
                            <div className="flex items-center mr-4">
                                <SchoolLogo size="small" />
                                <div className="hidden sm:flex flex-col ml-2">
                                    <span className="text-sm font-semibold text-gray-900">Mo/Kukurampola K.V.</span>
                                    <span className="text-xs text-gray-500">Student Mark System</span>
                                </div>
                            </div>
                            
                            {/* Dashboard Title */}
                            <div className="pl-4 border-l border-gray-200">
                                <h1 className="text-xl md:text-2xl font-bold text-indigo-600">{title}</h1>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            {isTeacher && (
                                <button
                                    onClick={() => navigate('/teacher/advanced')}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    Advanced Management
                                </button>
                            )}
                            <div className="flex items-center space-x-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-900">
                                        {currentUser?.name}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">
                                        {currentUser?.role}
                                        {currentUser?.grade && ` - Grade ${currentUser.grade}`}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {!isMobileMenuOpen ? (
                                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                ) : (
                                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-4 py-3 space-y-3">
                            <div className="flex flex-col space-y-2">
                                <span className="text-sm font-medium text-gray-900">
                                    {currentUser?.name}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">
                                    {currentUser?.role}
                                    {currentUser?.grade && ` - Grade ${currentUser.grade}`}
                                </span>
                            </div>
                            {isTeacher && (
                                <button
                                    onClick={() => {
                                        navigate('/teacher/advanced');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    Advanced Management
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-4 sm:px-0">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <div className="flex items-center mb-2 sm:mb-0">
                            <SchoolLogo size="small" />
                            <span className="ml-2 text-sm text-gray-600">Mo/Kukurampola K.V.</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} Student Mark Management System. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DashboardLayout; 