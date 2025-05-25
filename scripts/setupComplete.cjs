const { spawn } = require('child_process');
const path = require('path');

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running ${scriptName}...`);
    console.log('=' .repeat(50));
    
    const child = spawn('node', [path.join(__dirname, scriptName)], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} failed with exit code ${code}`);
        reject(new Error(`${scriptName} failed`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Error running ${scriptName}:`, error);
      reject(error);
    });
  });
}

async function setupComplete() {
  console.log('🎯 Starting Complete Database Setup');
  console.log('This will reset the database and generate fresh test data');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Reset Database
    await runScript('resetDatabase.cjs');
    
    // Step 2: Generate Test Data
    await runScript('generateTestData.cjs');
    
    // Step 3: Verify Data
    await runScript('verifyData.cjs');
    
    console.log('\n🎉 Complete setup finished successfully!');
    console.log('=' .repeat(60));
    console.log('\n🔑 Login Credentials:');
    console.log('👑 Admin: admin@school.com / Admin@123');
    console.log('👨‍🏫 Teacher: teacher@school.com / Teacher@123');
    console.log('👨‍🎓 Students: student.grade[1,3,5,7,9,11].[1-5]@school.com / Student@123');
    console.log('\n📊 Data Generated:');
    console.log('• 30 students (5 per grade: 1, 3, 5, 7, 9, 11)');
    console.log('• 9 subjects with marks for all students');
    console.log('• 3 terms per year (2024) with complete mark records');
    console.log('• Realistic score distribution and comments');
    
    console.log('\n🚀 You can now start the development server and test the application!');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Firebase service account key exists');
    console.log('2. Check your internet connection');
    console.log('3. Verify Firebase project permissions');
    process.exit(1);
  }
}

setupComplete(); 