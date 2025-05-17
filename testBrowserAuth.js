// This is a test script to be pasted directly into the browser console
// while on your application page to test authentication.

// Import Firebase libraries if needed
// (they should already be available through your application)

// Try to login with admin user
async function testAdminLogin() {
  try {
    const auth = window.firebase.auth; // Use your app's Firebase instance if available
    const result = await auth.signInWithEmailAndPassword('admin@school.com', 'Password123!');
    console.log('Login successful!', result.user);
    return result;
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    return null;
  }
}

// Execute the test
testAdminLogin(); 