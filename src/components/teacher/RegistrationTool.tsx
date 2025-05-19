import { useState, useEffect } from 'react';
import { database, auth } from '../../firebase';
import { ref, get, set, remove, update } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface PendingRegistration {
    id: string;
    email: string;
    password: string;
    timestamp: number;
}

interface UserData {
    role?: string;
    uid?: string;
    email?: string;
    name?: string;
    grade?: number;
}

const RegistrationTool = () => {
    const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<Set<string>>(new Set());
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        fetchPendingRegistrations();
    }, []);

    const fetchPendingRegistrations = async () => {
        try {
            setLoading(true);
            const pendingsRef = ref(database, 'pendingRegistrations');
            const snapshot = await get(pendingsRef);
            
            if (!snapshot.exists()) {
                setPendingRegistrations([]);
                return;
            }
            
            const pendings = snapshot.val();
            const pendingsList: PendingRegistration[] = [];
            
            for (const [key, value] of Object.entries(pendings)) {
                const entry = value as Record<string, string | number | boolean>;
                pendingsList.push({
                    id: key,
                    email: String(entry.email || ''),
                    password: String(entry.password || ''),
                    timestamp: Number(entry.timestamp || Date.now())
                });
            }
            
            setPendingRegistrations(pendingsList);
        } catch (error) {
            console.error('Error fetching pending registrations:', error);
            toast.error('Failed to load pending registrations');
        } finally {
            setLoading(false);
        }
    };

    const activatePendingRegistration = async (registration: PendingRegistration) => {
        if (processing.has(registration.id)) return;
        
        const newProcessing = new Set(processing);
        newProcessing.add(registration.id);
        setProcessing(newProcessing);
        
        try {
            // Get the associated user data
            const userRef = ref(database, `users/${registration.id}`);
            const userSnapshot = await get(userRef);
            
            if (!userSnapshot.exists()) {
                // Try to find the user by email instead
                const usersRef = ref(database, 'users');
                const allUsersSnapshot = await get(usersRef);
                
                if (!allUsersSnapshot.exists()) {
                    throw new Error("No users found in database");
                }
                
                const allUsers = allUsersSnapshot.val();
                let foundUserId = null;
                let foundUserData = null;
                
                // Search for a user with matching email
                for (const [userId, userData] of Object.entries(allUsers)) {
                    const user = userData as UserData;
                    if (user.email === registration.email) {
                        foundUserId = userId;
                        foundUserData = user;
                        break;
                    }
                }
                
                if (!foundUserId || !foundUserData) {
                    // Create a basic user record if none exists
                    foundUserId = registration.id;
                    foundUserData = {
                        email: registration.email,
                        role: 'student',
                        name: registration.email.split('@')[0],
                        grade: 0
                    };
                    
                    // Save this new user record
                    await set(ref(database, `users/${registration.id}`), foundUserData);
                    console.log('Created new user record for:', registration.email);
                }
            }
            
            // Fetch the user data again (either existing or newly created)
            const updatedUserSnapshot = await get(userRef);
            const userData = updatedUserSnapshot.val() as Record<string, string | number | boolean>;
            
            // Create the Firebase Auth account
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                registration.email, 
                registration.password
            );
            
            console.log('Created Firebase auth account:', userCredential.user.uid);
            
            // Update the user record with the new UID
            const updatedUser = {
                ...userData,
                uid: userCredential.user.uid
            };
            
            // Save the user with the Firebase UID
            await set(ref(database, `users/${userCredential.user.uid}`), updatedUser);
            console.log('Saved updated user with Firebase UID');
            
            // Remove the old user record if it's different from the new UID
            if (registration.id !== userCredential.user.uid) {
                await remove(userRef);
                console.log('Removed old user record');
            }
            
            // Remove the pending registration
            await remove(ref(database, `pendingRegistrations/${registration.id}`));
            console.log('Removed pending registration');
            
            toast.success(`Activated account for ${registration.email}`);
            
            // Update the list
            await fetchPendingRegistrations();
        } catch (error) {
            console.error('Error activating account:', error);
            let message = 'Failed to activate account';
            
            if (error instanceof Error) {
                message = `Error: ${error.message}`;
            }
            
            toast.error(message);
        } finally {
            const newProcessing = new Set(processing);
            newProcessing.delete(registration.id);
            setProcessing(newProcessing);
        }
    };

    const fixUserRegistrations = async () => {
        try {
            setLoading(true);
            
            // Step 1: Get all users and pending registrations
            const [usersSnapshot, pendingsSnapshot] = await Promise.all([
                get(ref(database, 'users')),
                get(ref(database, 'pendingRegistrations'))
            ]);
            
            if (!usersSnapshot.exists()) {
                toast.error('No users found in database');
                return;
            }
            
            const users = usersSnapshot.val();
            const pendings = pendingsSnapshot.exists() ? pendingsSnapshot.val() : {};
            
            // Step 2: Find student records created by teachers
            let fixedCount = 0;
            const updates: Record<string, Record<string, string | number>> = {};
            
            for (const [userId, userData] of Object.entries(users)) {
                const user = userData as UserData;
                
                // Skip if not a student or already has a proper UID matching their key
                if (user.role !== 'student' || user.uid === userId) continue;
                
                // Look for matching pending registration
                let pendingId = '';
                let pendingPassword = 'Student@123';  // Default
                
                for (const [key, value] of Object.entries(pendings)) {
                    const entry = value as Record<string, string | number | boolean>;
                    if (key === userId) {
                        pendingId = key;
                        pendingPassword = String(entry.password || pendingPassword);
                        break;
                    }
                }
                
                // Create a pending registration if none exists
                if (!pendingId) {
                    const timestamp = Date.now();
                    updates[`pendingRegistrations/${userId}`] = {
                        email: user.email || '',
                        password: `${(user.name || 'Student').charAt(0).toUpperCase() + (user.name || 'Student').slice(1)}@123`,
                        timestamp
                    };
                    fixedCount++;
                }
            }
            
            // Step 3: Apply all updates
            if (Object.keys(updates).length > 0) {
                await update(ref(database), updates);
                toast.success(`Fixed ${fixedCount} student registrations`);
                await fetchPendingRegistrations();
            } else {
                toast.success('No registrations need fixing');
            }
            
        } catch (error) {
            console.error('Error fixing registrations:', error);
            toast.error('Failed to fix registrations');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                    Student Registration Tool
                </h3>
                <div className="space-x-2">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                    >
                        {showDebug ? 'Hide Debug' : 'Show Debug'}
                    </button>
                    <button
                        onClick={fixUserRegistrations}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Fix Student Registrations'}
                    </button>
                    <button
                        onClick={fetchPendingRegistrations}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading pending registrations...</div>
            ) : pendingRegistrations.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No pending registrations found</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                {showDebug && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Password
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendingRegistrations.map((registration) => (
                                <tr key={registration.id} className={processing.has(registration.id) ? 'opacity-50 bg-gray-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {registration.email}
                                        </div>
                                        {showDebug && (
                                            <div className="text-xs text-gray-500">
                                                ID: {registration.id}
                                            </div>
                                        )}
                                    </td>
                                    {showDebug && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {registration.password}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(registration.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => activatePendingRegistration(registration)}
                                            disabled={processing.has(registration.id)}
                                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                                        >
                                            {processing.has(registration.id) ? 'Activating...' : 'Activate Account'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {showDebug && (
                <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Information:</h4>
                    <p className="text-xs text-gray-600 mb-4">
                        When a teacher creates a student account, a record is created in both the users collection and pendingRegistrations collection. 
                        The pendingRegistration contains the email and password, while the user record contains the student information.
                        <br /><br />
                        When a student tries to log in for the first time, they need to have a Firebase Authentication account created,
                        which is done by linking the pendingRegistration with a new Firebase Auth account.
                    </p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(pendingRegistrations, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default RegistrationTool; 