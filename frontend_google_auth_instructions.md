# Google Auth Implementation Guide for Frontend (Nawaf)

The backend is now ready to handle Google Sign-In. Here is what you need to do on the frontend.

## 1. Google Cloud Setup
You need to generate a **Google Client ID**.
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select the existing one.
3. Go to **APIs & Services** > **Credentials**.
4. Click **Create Credentials** > **OAuth client ID**.
5. Application type: **Web application**.
6. **Authorized JavaScript origins**: Add your frontend URL (e.g., `http://localhost:3000` and your production URL).
7. Copy the **Client ID** (e.g., `123456789-abc...apps.googleusercontent.com`).
   *   *Send this Client ID to the backend developer so they can add it to their `.env` file.*

## 2. Install Library
We recommend using `@react-oauth/google` for React apps.

```bash
npm install @react-oauth/google
# or
yarn add @react-oauth/google
```

## 3. Implementation Steps

### A. Wrap your App
In your main entry file (e.g., `main.tsx` or `App.tsx`), wrap your application with `GoogleOAuthProvider`.

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
  <App />
</GoogleOAuthProvider>
```

### B. Add the Login Button
In your Login component, add the Google Login button.

```tsx
import { GoogleLogin } from '@react-oauth/google';

// ... inside your component
<GoogleLogin
  onSuccess={async (credentialResponse) => {
    // 1. Get the ID token from Google
    const { credential } = credentialResponse;
    
    if (credential) {
        try {
            // 2. Send it to our Backend
            const res = await fetch('http://localhost:8000/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_token: credential 
                }),
            });
            
            if (!res.ok) throw new Error('Login failed');
            
            const data = await res.json();
            
            // 3. Handle Success (Save token, redirect, update state)
            console.log("Login Success:", data);
            // Example: setAuthToken(data.access_token);
        } catch (error) {
            console.error("Backend login failed", error);
        }
    }
  }}
  onError={() => {
    console.log('Login Failed');
  }}
/>
```

## 4. Backend API Contract
The backend endpoint is ready at:
`POST /auth/google`

**Request Body:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1..." // The credential string you get from Google
}
```

**Response (Success - 200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
      "user_id": 12,
      "email": "user@gmail.com",
      "full_name": "User Name",
      "picture_url": "https://lh3.googleusercontent.com/..."
  }
}
```
