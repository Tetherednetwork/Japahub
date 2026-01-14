---
description: Deploy JapaHub to Firebase
---

# Deploying JapaHub to Firebase

This guide covers two methods to deploy your application:
1.  **Firebase App Hosting (Recommended for Next.js)**: Deep integration with GitHub, automatic builds, and zero-config caching.
2.  **Firebase CLI**: Manual deployment from your local machine.

## Method 1: Firebase App Hosting (Best for Production)

### 1. Push Code to GitHub
Ensure your latest code is pushed to a GitHub repository.
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Connect in Firebase Console
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: **japahub-34138**.
3.  Navigate to **App Hosting** in the sidebar.
4.  Click **Get Started**.
5.  Follow the prompts to connect your GitHub account and select your `JapaHub` repository.
6.  **Build Settings**:
    *   Root Directory: `/` (leave as default)
    *   App ID: (leave as default or select existing)

### 3. Configure Environment Variables
In the App Hosting setup (or later in the "Settings" tab), add the following environment variables. **Do not skip this**, or your AI and Location features will fail.

*   `GEMINI_API_KEY`: [Your Gemini API Key]
*   `GOOGLE_PLACES_API_KEY`: [Your Google Places API Key]
*   `NEWS_API_KEY`: [Your News API Key]
*   `GNEWS_API_KEY`: [Your GNews API Key]

*Note: You do not need to add the `NEXT_PUBLIC_FIREBASE_*` keys if you are using the default hardcoded values in `firebase/config.ts`. If you want to override them, add them here too (e.g., `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).*

### 4. Deploy
Once connected, Firebase will automatically build and deploy your application. You can view the status in the "Rollouts" tab.

---

## Method 2: Firebase CLI (Manual Deployment)

Use this method if you want to deploy quickly from your terminal without GitHub.

### 1. Install Firebase Tools & Login
If you haven't already:
```bash
npm install -g firebase-tools
firebase login
```

### 2. Verify Project
Ensure you are using the correct project:
```bash
firebase use japahub-34138
```

### 3. Deploy
Run the deployment command. This will deploy your web app and your Firestore rules/indexes.
```bash
firebase deploy
```

*Note: For Next.js capabilities, the CLI might ask to enable "Web Frameworks". Say Yes.*
