#!/usr/bin/env node

/**
 * This script helps with initial project setup.
 * It creates a .env file template and provides instructions for Firebase setup.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env file already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('\x1b[33m%s\x1b[0m', '.env file already exists. Skipping creation.');
} else {
  // Create .env file from .env.example if it exists
  const envExamplePath = path.join(__dirname, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('\x1b[32m%s\x1b[0m', '.env file created from .env.example');
  } else {
    // Create default .env file
    const envContent = `# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_DATABASE_URL=
`;
    fs.writeFileSync(envPath, envContent);
    console.log('\x1b[32m%s\x1b[0m', '.env file created with default template');
  }
}

console.log('\n\x1b[36m%s\x1b[0m', '=== Student Mark System Setup ===');
console.log('\x1b[36m%s\x1b[0m', '===============================');
console.log('\n\x1b[37m%s\x1b[0m', 'Please follow these steps to complete setup:');

console.log('\n1. Edit the .env file with your Firebase configuration');
console.log('   You can find these values in your Firebase project settings');

console.log('\n2. Install dependencies:');
console.log('   npm install');

console.log('\n3. Start the development server:');
console.log('   npm run dev');

console.log('\n4. Default user credentials:');
console.log('   - Admin: admin@school.com / Admin@123');
console.log('   - Teacher: teacher@school.com / Teacher@123');
console.log('   - Student: student@school.com / Student@123');

console.log('\n\x1b[33m%s\x1b[0m', 'Note: For production deployment, make sure to set up environment variables in your hosting platform.');

// Ask if user wants to initialize Firebase setup
rl.question('\nWould you like to initialize Firebase setup now? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\nInitializing Firebase setup...');
    console.log('Please follow the Firebase CLI prompts:');
    
    const { spawn } = require('child_process');
    const firebaseInit = spawn('npx', ['firebase', 'init'], { stdio: 'inherit' });
    
    firebaseInit.on('close', (code) => {
      if (code === 0) {
        console.log('\n\x1b[32m%s\x1b[0m', 'Firebase initialization completed successfully!');
      } else {
        console.log('\n\x1b[31m%s\x1b[0m', 'Firebase initialization failed. Please run "npx firebase init" manually.');
      }
      rl.close();
    });
  } else {
    console.log('\nSkipping Firebase initialization. You can run "npx firebase init" later if needed.');
    rl.close();
  }
}); 