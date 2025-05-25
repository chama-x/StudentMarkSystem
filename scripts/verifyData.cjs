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

async function verifyData() {
  console.log('🔍 Starting data verification...');
  
  try {
    // 1. Verify Firebase Auth Users
    console.log('\n👥 Verifying Firebase Auth Users...');
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;
    
    console.log(`✅ Found ${users.length} users in Firebase Auth`);
    
    const adminUsers = users.filter(u => u.email === 'admin@school.com');
    const teacherUsers = users.filter(u => u.email === 'teacher@school.com');
    const studentUsers = users.filter(u => u.email && u.email.startsWith('student.grade'));
    
    console.log(`   👑 Admin users: ${adminUsers.length}`);
    console.log(`   👨‍🏫 Teacher users: ${teacherUsers.length}`);
    console.log(`   👨‍🎓 Student users: ${studentUsers.length}`);

    // 2. Verify Database Users
    console.log('\n📊 Verifying Database Users...');
    const usersSnapshot = await db.ref('users').once('value');
    const dbUsers = usersSnapshot.val() || {};
    const dbUserCount = Object.keys(dbUsers).length;
    
    console.log(`✅ Found ${dbUserCount} users in database`);
    
    const dbStudents = Object.values(dbUsers).filter(u => u.role === 'student');
    const dbTeachers = Object.values(dbUsers).filter(u => u.role === 'teacher');
    
    console.log(`   👨‍🎓 Students in DB: ${dbStudents.length}`);
    console.log(`   👨‍🏫 Teachers in DB: ${dbTeachers.length}`);

    // 3. Verify Students by Grade
    console.log('\n📚 Verifying Students by Grade...');
    const gradeDistribution = {};
    dbStudents.forEach(student => {
      const grade = student.grade;
      if (!gradeDistribution[grade]) {
        gradeDistribution[grade] = 0;
      }
      gradeDistribution[grade]++;
    });
    
    Object.keys(gradeDistribution).sort((a, b) => parseInt(a) - parseInt(b)).forEach(grade => {
      console.log(`   Grade ${grade}: ${gradeDistribution[grade]} students`);
    });

    // 4. Verify Subjects
    console.log('\n📖 Verifying Subjects...');
    const subjectsSnapshot = await db.ref('subjects').once('value');
    const subjects = subjectsSnapshot.val() || {};
    const subjectCount = Object.keys(subjects).length;
    
    console.log(`✅ Found ${subjectCount} subjects`);
    Object.entries(subjects).forEach(([id, subject]) => {
      console.log(`   ${id}: ${subject.name} (${subject.active ? 'Active' : 'Inactive'})`);
    });

    // 5. Verify Marks
    console.log('\n📝 Verifying Marks...');
    const marksSnapshot = await db.ref('marks').once('value');
    const marks = marksSnapshot.val() || {};
    const markCount = Object.keys(marks).length;
    
    console.log(`✅ Found ${markCount} marks`);
    
    // Analyze marks by grade and term
    const marksByGrade = {};
    const marksByTerm = {};
    
    Object.values(marks).forEach(mark => {
      const grade = mark.grade;
      const term = mark.term;
      
      if (!marksByGrade[grade]) marksByGrade[grade] = 0;
      if (!marksByTerm[term]) marksByTerm[term] = 0;
      
      marksByGrade[grade]++;
      marksByTerm[term]++;
    });
    
    console.log('\n   📊 Marks by Grade:');
    Object.keys(marksByGrade).sort((a, b) => parseInt(a) - parseInt(b)).forEach(grade => {
      console.log(`     Grade ${grade}: ${marksByGrade[grade]} marks`);
    });
    
    console.log('\n   📅 Marks by Term:');
    Object.keys(marksByTerm).forEach(term => {
      console.log(`     ${term}: ${marksByTerm[term]} marks`);
    });

    // 6. Sample Data Check
    console.log('\n🔍 Sample Data Check...');
    
    // Get a sample student
    const sampleStudent = dbStudents[0];
    if (sampleStudent) {
      console.log(`\n   👨‍🎓 Sample Student: ${sampleStudent.name} (Grade ${sampleStudent.grade})`);
      
      // Get marks for this student
      const studentMarks = Object.values(marks).filter(m => m.studentId === sampleStudent.uid);
      console.log(`     📝 Total marks: ${studentMarks.length}`);
      
      if (studentMarks.length > 0) {
        const sampleMark = studentMarks[0];
        const subject = subjects[sampleMark.subjectId];
        console.log(`     📖 Sample mark: ${sampleMark.score}/100 in ${subject?.name || 'Unknown Subject'} (${sampleMark.term})`);
        console.log(`     💬 Comment: ${sampleMark.comment}`);
      }
    }

    // 7. Data Integrity Check
    console.log('\n🔒 Data Integrity Check...');
    
    let integrityIssues = 0;
    
    // Check if all students have marks
    for (const student of dbStudents) {
      const studentMarks = Object.values(marks).filter(m => m.studentId === student.uid);
      const expectedMarks = subjectCount * 3; // 3 terms per subject
      
      if (studentMarks.length !== expectedMarks) {
        console.warn(`   ⚠️  ${student.name} has ${studentMarks.length} marks, expected ${expectedMarks}`);
        integrityIssues++;
      }
    }
    
    // Check if all marks reference valid students and subjects
    for (const [markId, mark] of Object.entries(marks)) {
      const student = dbUsers[mark.studentId];
      const subject = subjects[mark.subjectId];
      
      if (!student) {
        console.warn(`   ⚠️  Mark ${markId} references non-existent student ${mark.studentId}`);
        integrityIssues++;
      }
      
      if (!subject) {
        console.warn(`   ⚠️  Mark ${markId} references non-existent subject ${mark.subjectId}`);
        integrityIssues++;
      }
    }
    
    if (integrityIssues === 0) {
      console.log('   ✅ No data integrity issues found');
    } else {
      console.log(`   ⚠️  Found ${integrityIssues} data integrity issues`);
    }

    // 8. Summary
    console.log('\n📋 Verification Summary:');
    console.log(`   👥 Total users: ${users.length} (Auth) / ${dbUserCount} (Database)`);
    console.log(`   👨‍🎓 Students: ${studentUsers.length} (Auth) / ${dbStudents.length} (Database)`);
    console.log(`   👨‍🏫 Teachers: ${teacherUsers.length + adminUsers.length} (Auth) / ${dbTeachers.length} (Database)`);
    console.log(`   📖 Subjects: ${subjectCount}`);
    console.log(`   📝 Marks: ${markCount}`);
    console.log(`   🔒 Integrity issues: ${integrityIssues}`);
    
    if (integrityIssues === 0 && dbUserCount === users.length) {
      console.log('\n🎉 All data verified successfully! The system is ready for testing.');
    } else {
      console.log('\n⚠️  Some issues found. Please review the data.');
    }

  } catch (error) {
    console.error('❌ Error during data verification:', error);
    throw error;
  }
}

// Run the verification
verifyData()
  .then(() => {
    console.log('\n✨ Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  }); 