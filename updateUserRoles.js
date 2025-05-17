import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
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
const db = getDatabase();

// Define users to update
const usersToUpdate = [
  {
    uid: 'bAlZ4mVKJvOTK5QoaIJX2rJAMdJ2',
    email: 'admin@school.com',
    role: 'admin',
    name: 'Admin User'
  },
  {
    uid: 'WUSm4mNQpZfvUQOjShdTrl8Mbt82',
    email: 'teacher@school.com',
    role: 'teacher',
    name: 'Teacher User'
  },
  {
    uid: 'oEo2YJ2Lv6YHtgIHoG0acJ9QFtG3',
    email: 'grade2@school.com',
    role: 'student',
    name: 'Grade 2 Student',
    grade: 2
  }
];

// Update user data in Database
async function updateUserRoles() {
  try {
    for (const user of usersToUpdate) {
      try {
        // Store user data in Realtime Database
        const userData = {
          uid: user.uid,
          email: user.email,
          role: user.role,
          name: user.name,
          ...(user.grade && { grade: user.grade })
        };
        
        await db.ref(`users/${user.uid}`).set(userData);
        console.log(`Updated user data for: ${user.email}`);
      } catch (error) {
        console.error(`Error updating user ${user.email}:`, error);
      }
    }
    console.log('User updates completed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

await updateUserRoles(); 