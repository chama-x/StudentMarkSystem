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

// Define users to create
const users = [
  {
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'teacher@school.com',
    password: 'teacher123',
    role: 'teacher',
    name: 'Teacher User'
  },
  {
    email: 'student@school.com',
    password: 'student123',
    role: 'student',
    name: 'Student User',
    grade: 10
  }
];

// Create users
async function createUsers() {
  try {
    for (const user of users) {
      try {
        // Create the user in Firebase Auth
        const userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.name
        });
        
        console.log(`Created auth user: ${userRecord.uid}`);
        
        // Store user data in Realtime Database
        const userData = {
          uid: userRecord.uid,
          email: user.email,
          role: user.role,
          name: user.name,
          ...(user.grade && { grade: user.grade })
        };
        
        await db.ref(`users/${userRecord.uid}`).set(userData);
        console.log(`Added user data to database for: ${user.email}`);
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
    console.log('User creation completed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

await createUsers(); 