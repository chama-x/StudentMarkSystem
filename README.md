# Student Mark System

A web application for managing student marks and academic records.

## Features

- User authentication (Admin, Teacher, Student roles)
- Mark entry and management
- Student record management
- Subject management
- Role-based access control

## Tech Stack

- React
- TypeScript
- Vite
- Firebase (Authentication, Realtime Database)
- React Router
- CSS Modules

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

## Local Development Setup

1. **Clone the repository**

   ```bash
git clone https://github.com/yourusername/StudentMarkSystem.git
   cd StudentMarkSystem
   ```

2. **Run the setup script**

```bash
npm run setup
```

This script will guide you through setting up your environment variables and Firebase configuration.

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## Initial User Setup

The system comes with three default user accounts:

1. **Admin**
   - Email: admin@school.com
   - Password: Admin@123

2. **Teacher**
- Email: teacher@school.com
- Password: Teacher@123

3. **Student**
   - Email: student@school.com
   - Password: Student@123

## Building for Production

```bash
npm run build
```

This will create a `dist` directory with the production build.

## Deployment

### Automated Deployment with GitHub Actions

This project includes GitHub Actions workflows for CI/CD:

- **Continuous Integration**: Automatically runs linting and builds the project on push and pull requests to main branch.
- **Firebase Deployment**: Automatically deploys to Firebase on push to main branch.
- **Netlify Deployment**: Automatically deploys to Netlify on push to main branch.

To use these workflows:

1. Set up the following secrets in your GitHub repository:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_SERVICE_ACCOUNT` (for Firebase deployment)
   - `NETLIFY_AUTH_TOKEN` (for Netlify deployment)
   - `NETLIFY_SITE_ID` (for Netlify deployment)

2. Push to the main branch to trigger deployments.

### Manual Deployment to Netlify

1. **Create a new site on Netlify**

   - Connect your GitHub repository
   - Set the build command to `npm run build`
   - Set the publish directory to `dist`

2. **Configure environment variables**

   Add all the environment variables from your `.env` file to your Netlify site's environment variables section.

3. **Deploy**

   Netlify will automatically deploy your site when you push changes to your connected repository.

### Manual Deployment to Firebase

1. **Install Firebase CLI**

```bash
npm install -g firebase-tools
```

2. **Login to Firebase**

```bash
firebase login
```

3. **Initialize Firebase in your project (if not already done)**

```bash
firebase init
```

4. **Build the project**

```bash
npm run build
```

5. **Deploy to Firebase**

```bash
firebase deploy
```

## Firebase Configuration

This project requires a Firebase project with the following services enabled:

- Authentication (Email/Password provider)
- Realtime Database

### Setting Up Firebase

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com/)
2. Enable Email/Password authentication
3. Create a Realtime Database
4. Set up security rules for your database
5. Register a web app in your Firebase project to get your configuration

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
