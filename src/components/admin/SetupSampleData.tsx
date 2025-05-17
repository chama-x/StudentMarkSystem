import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { setupSampleData, clearSampleData } from '../../utils/setupSampleData';
import { toast } from 'react-hot-toast';

const SetupSampleData = () => {
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    const handleSetupData = async () => {
        if (!currentUser || currentUser.role !== 'teacher') {
            toast.error('Only teachers can set up sample data');
            return;
        }

        try {
            setLoading(true);
            await setupSampleData(currentUser.uid);
            toast.success('Sample data set up successfully!');
        } catch (error) {
            console.error('Error setting up sample data:', error);
            toast.error('Failed to set up sample data');
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = async () => {
        if (!currentUser || currentUser.role !== 'teacher') {
            toast.error('Only teachers can clear sample data');
            return;
        }

        if (!window.confirm('Are you sure you want to clear all sample data? This cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            await clearSampleData(currentUser.uid);
            toast.success('Sample data cleared successfully!');
        } catch (error) {
            console.error('Error clearing sample data:', error);
            toast.error('Failed to clear sample data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 flex gap-2">
            <button
                onClick={handleSetupData}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Setup Sample Data'}
            </button>
            <button
                onClick={handleClearData}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Clear Sample Data'}
            </button>
        </div>
    );
};

export default SetupSampleData; 