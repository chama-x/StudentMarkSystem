import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFile } from 'fs/promises';

// Load service account key
const serviceAccountString = await readFile('./studentmarknew-firebase-adminsdk-fbsvc-a7c304ae1d.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountString);

// Initialize the app with a service account
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://studentmarknew-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const auth = getAuth();

// Test users to reset passwords
const usersToReset = [
  { email: 'test_admin@example.com', newPassword: 'Test789!' },
  { email: 'test_teacher@example.com', newPassword: 'Test789!' },
  { email: 'test_student@example.com', newPassword: 'Test789!' },
];

// Reset user passwords by email
async function resetPasswordsByEmail() {
  try {
    console.log("Resetting passwords for test users...");
    
    // Get project config to verify we're connecting to the correct project
    console.log("Verifying Firebase project...");
    const projectConfig = await auth.projectConfigManager().getProjectConfig();
    console.log("Connected to Firebase project:", projectConfig);
    
    for (const user of usersToReset) {
      try {
        // Get user by email
        const userRecord = await auth.getUserByEmail(user.email);
        console.log(`Found user with email ${user.email}: UID=${userRecord.uid}`);
        
        // Reset password
        await auth.updateUser(userRecord.uid, {
          password: user.newPassword,
          emailVerified: true // Verify email to avoid any issues
        });
        
        console.log(`Reset password for ${user.email} to '${user.newPassword}'`);
      } catch (error) {
        console.error(`Error resetting password for ${user.email}:`, error);
      }
    }
    
    console.log("Password reset completed for test users.");
  } catch (error) {
    console.error("Error:", error);
  }
}

await resetPasswordsByEmail(); 