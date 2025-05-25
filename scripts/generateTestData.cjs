const admin = require('firebase-admin');

// Initialize Firebase Admin (reuse existing app if already initialized)
if (!admin.apps.length) {
  const serviceAccount = require('../studentmarknew-firebase-adminsdk-fbsvc-1106a7ac85.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://studentmarknew-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const auth = admin.auth();
const db = admin.database();

// Configuration
const GRADES = [1, 3, 5, 7, 9, 11];
const STUDENTS_PER_GRADE = 5;
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const CURRENT_YEAR = 2024;

const SUBJECTS = [
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

// Student names for different grades
const STUDENT_NAMES = {
  1: ['Amara Silva', 'Bimal Perera', 'Chamari Fernando', 'Dilshan Rajapaksa', 'Erandi Wickrama'],
  3: ['Fathima Hassan', 'Gayan Mendis', 'Hiruni Jayawardena', 'Isuru Bandara', 'Janaki Wijesinghe'],
  5: ['Kasun Rathnayake', 'Lakshmi Gunawardena', 'Mahesh Dissanayake', 'Nayomi Seneviratne', 'Osanda Kumara'],
  7: ['Priyanka Samaraweera', 'Qasim Ahmed', 'Rashini Karunaratne', 'Saman Liyanage', 'Tharushi Madushani'],
  9: ['Udara Pathirana', 'Vindya Herath', 'Wasantha Gunasekara', 'Ximena Rodrigo', 'Yasiru Tennakoon'],
  11: ['Zara Fonseka', 'Ashan Wijeratne', 'Bhagya Senanayake', 'Chathura Ranasinghe', 'Dinusha Amarasinghe']
};

// Generate random marks based on grade level
function generateRandomMark(grade) {
  // Higher grades tend to have slightly lower average marks due to difficulty
  const baseScore = grade <= 5 ? 75 : grade <= 9 ? 70 : 65;
  const variation = 25;
  
  const score = Math.max(35, Math.min(100, 
    Math.round(baseScore + (Math.random() - 0.5) * variation)
  ));
  
  return score;
}

// Generate comment based on score
function generateComment(score) {
  if (score >= 90) return 'Excellent performance! Keep up the great work.';
  if (score >= 80) return 'Very good work. Continue to strive for excellence.';
  if (score >= 70) return 'Good effort. There is room for improvement.';
  if (score >= 60) return 'Satisfactory work. Please focus more on studies.';
  if (score >= 50) return 'Needs improvement. Additional support recommended.';
  return 'Requires immediate attention and extra help.';
}

async function createUser(email, password, userData) {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: userData.name
    });

    // Store user data in Realtime Database
    await db.ref(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: email,
      name: userData.name,
      role: userData.role,
      ...(userData.grade && { grade: userData.grade }),
      ...(userData.subjects && { subjects: userData.subjects })
    });

    console.log(`✅ Created ${userData.role}: ${userData.name} (${email})`);
    return userRecord.uid;
  } catch (error) {
    console.error(`❌ Failed to create user ${email}:`, error.message);
    throw error;
  }
}

async function generateTestData() {
  console.log('🚀 Starting test data generation...');
  
  try {
    // 1. Create Admin User
    console.log('\n👑 Creating Admin User...');
    const adminUid = await createUser(
      'admin@school.com',
      'Admin@123',
      {
        name: 'System Administrator',
        role: 'teacher', // Admin is treated as teacher with full access
        subjects: SUBJECTS
      }
    );

    // 2. Create Teacher User
    console.log('\n👨‍🏫 Creating Teacher User...');
    const teacherUid = await createUser(
      'teacher@school.com',
      'Teacher@123',
      {
        name: 'John Teacher',
        role: 'teacher',
        subjects: SUBJECTS
      }
    );

    // 3. Get subject IDs from database
    console.log('\n📚 Fetching subject IDs...');
    const subjectsSnapshot = await db.ref('subjects').once('value');
    const subjectsData = subjectsSnapshot.val();
    const subjectIds = Object.keys(subjectsData);
    console.log(`✅ Found ${subjectIds.length} subjects`);

    // 4. Create Students and Generate Marks
    console.log('\n👨‍🎓 Creating Students and Generating Marks...');
    
    let totalStudents = 0;
    let totalMarks = 0;

    for (const grade of GRADES) {
      console.log(`\n📝 Processing Grade ${grade}...`);
      
      const studentNames = STUDENT_NAMES[grade];
      
      for (let i = 0; i < STUDENTS_PER_GRADE; i++) {
        const studentName = studentNames[i];
        const studentEmail = `student.grade${grade}.${i + 1}@school.com`;
        
        // Create student user
        const studentUid = await createUser(
          studentEmail,
          'Student@123',
          {
            name: studentName,
            role: 'student',
            grade: grade
          }
        );
        
        totalStudents++;

        // Generate marks for each subject and term
        for (const subjectId of subjectIds) {
          for (const term of TERMS) {
            const score = generateRandomMark(grade);
            const comment = generateComment(score);
            
            const markData = {
              studentId: studentUid,
              subjectId: subjectId,
              grade: grade,
              score: score,
              comment: comment,
              teacherId: teacherUid,
              timestamp: Date.now() + Math.random() * 1000, // Slight variation in timestamps
              year: CURRENT_YEAR,
              term: term
            };

            // Add mark to database
            const markRef = db.ref('marks').push();
            await markRef.set(markData);
            totalMarks++;
          }
        }
        
        console.log(`   ✅ Created student: ${studentName} with ${subjectIds.length * TERMS.length} marks`);
      }
    }

    // 5. Summary
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👑 Admin: admin@school.com (password: Admin@123)`);
    console.log(`   👨‍🏫 Teacher: teacher@school.com (password: Teacher@123)`);
    console.log(`   👨‍🎓 Students: ${totalStudents} students across grades ${GRADES.join(', ')}`);
    console.log(`   📝 Marks: ${totalMarks} marks generated`);
    console.log(`   📚 Subjects: ${subjectIds.length} subjects`);
    console.log(`   📅 Terms: ${TERMS.length} terms for year ${CURRENT_YEAR}`);
    
    console.log('\n🔑 Student Login Pattern:');
    console.log('   Email: student.grade[X].[1-5]@school.com');
    console.log('   Password: Student@123');
    console.log('   Example: student.grade1.1@school.com');

    console.log('\n📋 Grade Distribution:');
    GRADES.forEach(grade => {
      console.log(`   Grade ${grade}: ${STUDENTS_PER_GRADE} students`);
    });

  } catch (error) {
    console.error('❌ Error during test data generation:', error);
    throw error;
  }
}

// Run the data generation
generateTestData()
  .then(() => {
    console.log('\n✨ Data generation completed! You can now test the application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Data generation failed:', error);
    process.exit(1);
  }); 