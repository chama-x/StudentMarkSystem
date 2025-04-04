import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getUser } from '../../services/realtimeDatabase';
import { FirebaseError } from 'firebase/app';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            const userCredential = await login(email, password);
            const userData = await getUser(userCredential.user.uid);
            
            if (!userData) {
                toast.error('User data not found');
                return;
            }

            if (userData.role === 'student') {
                navigate('/student');
            } else if (userData.role === 'teacher') {
                // Store teacher session data to handle auth during student creation
                localStorage.setItem('teacherSession', JSON.stringify({
                    uid: userData.uid,
                    email: userData.email,
                    cachedAuth: password // Store password temporarily for re-auth if needed
                }));
                navigate('/teacher');
            }
            
            toast.success('Successfully logged in!');
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof FirebaseError && error.code === 'auth/invalid-credential') {
                toast.error('Invalid email or password');
            } else {
                toast.error('Failed to log in');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-background)',
            padding: 'var(--spacing-4)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-8)'
            }}>
                {/* Logo & Title Section */}
                <div style={{ textAlign: 'center' }}>
                    {/* Logo */}
                    <div style={{
                        width: '88px',
                        height: '88px',
                        margin: '0 auto var(--spacing-6)',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow)',
                        border: '4px solid rgba(14, 165, 233, 0.15)'
                    }}>
                        <svg style={{ width: '44px', height: '44px', color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                        <h1 style={{
                            fontSize: 'var(--font-size-3xl)',
                            fontWeight: 'bold',
                            color: 'var(--color-text)',
                            lineHeight: '1.2',
                            letterSpacing: '-0.025em'
                        }}>
                            Student Mark
                            <span style={{
                                display: 'block',
                                color: 'var(--color-primary)',
                                marginTop: 'var(--spacing-2)',
                                fontSize: '0.95em'
                            }}>Management</span>
                        </h1>
                    </div>
                    <p style={{
                        fontSize: 'var(--font-size-lg)',
                        color: 'var(--color-text-secondary)',
                        maxWidth: '280px',
                        margin: '0 auto'
                    }}>
                        Sign in to access your academic records
                    </p>
                </div>

                {/* Login Form */}
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                style={{
                                    display: 'block',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '500',
                                    color: 'var(--color-text)',
                                    marginBottom: 'var(--spacing-1)'
                                }}
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="input-field"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                style={{
                                    display: 'block',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '500',
                                    color: 'var(--color-text)',
                                    marginBottom: 'var(--spacing-1)'
                                }}
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="input-field"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Sign in Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ marginTop: 'var(--spacing-2)' }}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        {/* Create Account Link */}
                        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                            <p style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-2)'
                            }}>
                                New to the platform?
                            </p>
                            <Link
                                to="/register"
                                className="btn"
                                style={{
                                    width: '100%',
                                    backgroundColor: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    border: '1px solid var(--color-border)'
                                }}
                            >
                                Create new account
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Teacher Info */}
                <div style={{
                    backgroundColor: '#EFF6FF',
                    borderRadius: 'var(--border-radius)',
                    padding: 'var(--spacing-4)',
                    border: '1px solid #E0F2FE'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div style={{
                            padding: 'var(--spacing-2)',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--border-radius-sm)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <svg style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                color: 'var(--color-text)',
                                marginBottom: 'var(--spacing-1)'
                            }}>
                                Teacher Login
                            </h3>
                            <div style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--spacing-1)'
                            }}>
                                <p>Email: teacher@school.com</p>
                                <p>Password: Teacher@123</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login; 