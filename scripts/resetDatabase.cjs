const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../studentmarknew-firebase-adminsdk-fbsvc-1106a7ac85.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://studentmarknew-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const auth = admin.auth();
const db = admin.database();

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // 1. Delete all users from Firebase Auth
    console.log('🗑️  Deleting all Firebase Auth users...');
    const listUsersResult = await auth.listUsers();
    const deletePromises = listUsersResult.users.map(user => 
      auth.deleteUser(user.uid).catch(err => 
        console.warn(`Failed to delete user ${user.uid}:`, err.message)
      )
    );
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${listUsersResult.users.length} Firebase Auth users`);

    // 2. Clear all database data
    console.log('🗑️  Clearing all database data...');
    await db.ref().set(null);
    console.log('✅ Database cleared');

    // 3. Initialize basic database structure
    console.log('🏗️  Initializing database structure...');
    const initialStructure = {
      users: {},
      marks: {},
      subjects: {}
    };
    await db.ref().set(initialStructure);
    console.log('✅ Basic database structure created');

    // 4. Initialize subjects
    console.log('📚 Initializing subjects...');
    const subjects = [
      'Sinhala',
      'English', 
      'Mathematics',
      'Science',
      'History',
      'Buddhism',
      'Health & Physical Education',
      'Art',
      'Tamil'
    ];

    const subjectsData = {};
    subjects.forEach((subject, index) => {
      subjectsData[`subject_${index + 1}`] = {
        name: subject,
        active: true
      };
    });

    await db.ref('subjects').set(subjectsData);
    console.log('✅ Subjects initialized');

    console.log('🎉 Database reset completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Deleted all Firebase Auth users`);
    console.log(`   - Cleared all database data`);
    console.log(`   - Recreated basic structure`);
    console.log(`   - Initialized ${subjects.length} subjects`);
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('\n✨ Reset completed! You can now run the data generation script.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Reset failed:', error);
    process.exit(1);
  }); 