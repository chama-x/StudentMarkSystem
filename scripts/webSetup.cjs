const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { getDatabase, ref, set, push, get } = require('firebase/database');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsOg0o3RGczlOYm7A4W6EBO98bKdXce70",
  authDomain: "studentmarknew.firebaseapp.com",
  databaseURL: "https://studentmarknew-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studentmarknew",
  storageBucket: "studentmarknew.firebasestorage.app",
  messagingSenderId: "472997938076",
  appId: "1:472997938076:web:ebaf0fb9e5c3c5c967be59",
  measurementId: "G-RZ0EF5Y01M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

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

async function createUserAccount(email, password, userData) {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store user data in database
    await set(ref(database, `users/${user.uid}`), {
      uid: user.uid,
      email: email,
      name: userData.name,
      role: userData.role,
      ...(userData.grade && { grade: userData.grade }),
      ...(userData.subjects && { subjects: userData.subjects })
    });

    console.log(`✅ Created ${userData.role}: ${userData.name} (${email})`);
    
    // Sign out after creating user
    await signOut(auth);
    
    return user.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  User ${email} already exists, skipping...`);
      return null;
    }
    console.error(`❌ Failed to create user ${email}:`, error.message);
    throw error;
  }
}

async function initializeSubjects() {
  console.log('📚 Initializing subjects...');
  
  const subjectsData = {};
  SUBJECTS.forEach((subject, index) => {
    subjectsData[`subject_${index + 1}`] = {
      name: subject,
      active: true
    };
  });

  await set(ref(database, 'subjects'), subjectsData);
  console.log('✅ Subjects initialized');
  
  return Object.keys(subjectsData);
}

async function generateMarks(studentUid, teacherUid, subjectIds, grade) {
  let markCount = 0;
  
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
        timestamp: Date.now() + Math.random() * 1000,
        year: CURRENT_YEAR,
        term: term
      };

      const markRef = push(ref(database, 'marks'));
      await set(markRef, markData);
      markCount++;
    }
  }
  
  return markCount;
}

async function setupDatabase() {
  console.log('🚀 Starting database setup with Web SDK...');
  
  try {
    // 1. Initialize subjects first
    const subjectIds = await initializeSubjects();
    
    // 2. Create admin user
    console.log('\n👑 Creating Admin User...');
    const adminUid = await createUserAccount(
      'admin@school.com',
      'Admin@123',
      {
        name: 'System Administrator',
        role: 'teacher',
        subjects: SUBJECTS
      }
    );

    // 3. Create teacher user
    console.log('\n👨‍🏫 Creating Teacher User...');
    const teacherUid = await createUserAccount(
      'teacher@school.com',
      'Teacher@123',
      {
        name: 'John Teacher',
        role: 'teacher',
        subjects: SUBJECTS
      }
    );

    // Use admin as teacher if teacher creation failed
    const activeTeacherUid = teacherUid || adminUid;

    // 4. Create students and generate marks
    console.log('\n👨‍🎓 Creating Students and Generating Marks...');
    
    let totalStudents = 0;
    let totalMarks = 0;

    for (const grade of GRADES) {
      console.log(`\n📝 Processing Grade ${grade}...`);
      
      const studentNames = STUDENT_NAMES[grade];
      
      for (let i = 0; i < STUDENTS_PER_GRADE; i++) {
        const studentName = studentNames[i];
        const studentEmail = `student.grade${grade}.${i + 1}@school.com`;
        
        const studentUid = await createUserAccount(
          studentEmail,
          'Student@123',
          {
            name: studentName,
            role: 'student',
            grade: grade
          }
        );
        
        if (studentUid) {
          totalStudents++;
          
          // Generate marks for this student
          const markCount = await generateMarks(studentUid, activeTeacherUid, subjectIds, grade);
          totalMarks += markCount;
          
          console.log(`   ✅ Created student: ${studentName} with ${markCount} marks`);
        }
      }
    }

    // 5. Summary
    console.log('\n🎉 Database setup completed successfully!');
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
    console.error('❌ Error during database setup:', error);
    throw error;
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('\n✨ Setup completed! You can now test the application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  }); 