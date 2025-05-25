# Database Setup Scripts

This directory contains scripts to set up and manage the Firebase database for the Student Mark System.

## Prerequisites

1. **Firebase Service Account Key**: Ensure `studentmarknew-firebase-adminsdk-fbsvc-1106a7ac85.json` is in the project root
2. **Node.js**: Version 16 or higher
3. **Firebase Admin SDK**: Already included in devDependencies

## Scripts Overview

### 🚀 Quick Setup (Recommended)

```bash
npm run db:setup
```

This runs all scripts in sequence: reset → generate → verify

### 📋 Individual Scripts

#### 1. Reset Database
```bash
npm run db:reset
```
- Deletes all Firebase Auth users
- Clears all database data
- Recreates basic database structure
- Initializes subjects

#### 2. Generate Test Data
```bash
npm run db:generate
```
- Creates admin and teacher accounts
- Generates 30 students (5 per grade: 1, 3, 5, 7, 9, 11)
- Creates realistic marks for all students across 3 terms
- Generates appropriate comments based on scores

#### 3. Verify Data
```bash
npm run db:verify
```
- Checks data integrity
- Validates user counts and relationships
- Displays comprehensive statistics
- Reports any issues found

## Generated Data Structure

### 👥 Users Created

| Role | Count | Email Pattern | Password |
|------|-------|---------------|----------|
| Admin | 1 | admin@school.com | Admin@123 |
| Teacher | 1 | teacher@school.com | Teacher@123 |
| Students | 30 | student.grade[X].[1-5]@school.com | Student@123 |

### 📚 Students by Grade

- **Grade 1**: 5 students (Amara Silva, Bimal Perera, Chamari Fernando, Dilshan Rajapaksa, Erandi Wickrama)
- **Grade 3**: 5 students (Fathima Hassan, Gayan Mendis, Hiruni Jayawardena, Isuru Bandara, Janaki Wijesinghe)
- **Grade 5**: 5 students (Kasun Rathnayake, Lakshmi Gunawardena, Mahesh Dissanayake, Nayomi Seneviratne, Osanda Kumara)
- **Grade 7**: 5 students (Priyanka Samaraweera, Qasim Ahmed, Rashini Karunaratne, Saman Liyanage, Tharushi Madushani)
- **Grade 9**: 5 students (Udara Pathirana, Vindya Herath, Wasantha Gunasekara, Ximena Rodrigo, Yasiru Tennakoon)
- **Grade 11**: 5 students (Zara Fonseka, Ashan Wijeratne, Bhagya Senanayake, Chathura Ranasinghe, Dinusha Amarasinghe)

### 📖 Subjects

1. Sinhala
2. English
3. Mathematics
4. Science
5. History
6. Buddhism
7. Health & Physical Education
8. Art
9. Tamil

### 📝 Marks Distribution

- **Total Marks**: 810 (30 students × 9 subjects × 3 terms)
- **Terms**: Term 1, Term 2, Term 3 (Year 2024)
- **Score Range**: 35-100 (realistic distribution based on grade level)
- **Comments**: Automatically generated based on score ranges

## Score Distribution Logic

- **Grade 1-5**: Higher average scores (base: 75)
- **Grade 7-9**: Medium average scores (base: 70)
- **Grade 11**: Lower average scores (base: 65) due to increased difficulty

## Comment Categories

| Score Range | Comment Type |
|-------------|--------------|
| 90-100 | Excellent performance! Keep up the great work. |
| 80-89 | Very good work. Continue to strive for excellence. |
| 70-79 | Good effort. There is room for improvement. |
| 60-69 | Satisfactory work. Please focus more on studies. |
| 50-59 | Needs improvement. Additional support recommended. |
| Below 50 | Requires immediate attention and extra help. |

## Testing Login Credentials

### Admin/Teacher Access
- **Admin**: admin@school.com / Admin@123
- **Teacher**: teacher@school.com / Teacher@123

### Student Access Examples
- **Grade 1 Student 1**: student.grade1.1@school.com / Student@123
- **Grade 3 Student 2**: student.grade3.2@school.com / Student@123
- **Grade 5 Student 3**: student.grade5.3@school.com / Student@123
- **Grade 7 Student 4**: student.grade7.4@school.com / Student@123
- **Grade 9 Student 5**: student.grade9.5@school.com / Student@123
- **Grade 11 Student 1**: student.grade11.1@school.com / Student@123

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check Firebase service account key path
   - Verify Firebase project permissions
   - Ensure correct database URL

2. **Network Errors**
   - Check internet connection
   - Verify Firebase project is active
   - Check firewall settings

3. **Script Failures**
   - Run scripts individually to isolate issues
   - Check Node.js version (>=16 required)
   - Verify all dependencies are installed

### Manual Cleanup

If you need to manually clean up:

```bash
# Reset only
npm run db:reset

# Generate data only (after reset)
npm run db:generate

# Verify data only
npm run db:verify
```

## Development Workflow

1. **Initial Setup**: Run `npm run db:setup` once
2. **Testing**: Use generated credentials to test different user roles
3. **Reset When Needed**: Run `npm run db:reset` if data gets corrupted
4. **Verify Integrity**: Run `npm run db:verify` to check data health

## Security Notes

- All passwords are set to simple patterns for testing
- In production, implement proper password policies
- Service account key should never be committed to version control
- Consider using environment variables for sensitive configuration 