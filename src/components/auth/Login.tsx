import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getUser } from '../../services/realtimeDatabase';
import { FirebaseError } from 'firebase/app';
import schoolBg from '../../assets/school.webp';
import SchoolLogo from '../common/SchoolLogo';

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
        <div className="login-background" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-4)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Image with Blur - Fixed Position */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -2,
                backgroundImage: `url(${schoolBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                filter: 'blur(8px)',
                transform: 'scale(1.1)', // Prevent blur edge artifacts
                opacity: 0.7  // Reduced opacity
            }} />
            
            {/* White overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                backgroundColor: 'rgba(255, 255, 255, 0.5)'  // White shade with transparency
            }} />
            
            <div style={{
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-8)',
                zIndex: 1
            }}>
                {/* Logo & Title Section */}
                <div style={{ textAlign: 'center' }}>
                    {/* School Logo */}
                    <SchoolLogo size="large" withName={true} />

                    {/* Title */}
                    <div style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                        <h1 style={{
                            fontSize: 'var(--font-size-3xl)',
                            fontWeight: 'bold',
                            color: 'var(--color-text)',
                            lineHeight: '1.2',
                            letterSpacing: '-0.025em',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
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
                        margin: '0 auto',
                        textShadow: '0 1px 1px rgba(0, 0, 0, 0.05)'
                    }}>
                        Sign in to access your academic records
                    </p>
                </div>

                {/* Login Form */}
                <div className="card blur-backdrop" style={{ 
                    padding: 'var(--spacing-6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}>
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
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
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
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
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
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                <div className="blur-backdrop" style={{
                    backgroundColor: 'rgba(239, 246, 255, 0.9)',
                    borderRadius: 'var(--border-radius)',
                    padding: 'var(--spacing-4)',
                    border: '1px solid rgba(224, 242, 254, 0.8)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div style={{
                            padding: 'var(--spacing-2)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
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