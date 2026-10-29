# Google OAuth Setup Guide

## Redirect URLs for Google Cloud Console

When setting up Google OAuth in the Google Cloud Console, you need to add these authorized redirect URIs:

### Development (Local)
```
http://localhost:3000/api/auth/callback/google
```

### Production
```
https://yourdomain.com/api/auth/callback/google
```

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or **Google Identity Services API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy your **Client ID** and **Client Secret**

### 2. Update Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production:
```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Update Database Schema

Run the following to update your database schema:

```bash
npx prisma db push
```

This will add the `googleId` field to the User model.

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to `/login` or `/register`
3. Click "Sign in with Google" or "Sign up with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back and logged in

## Features

- ✅ Automatic user creation if they don't exist
- ✅ Links Google account to existing email if user already exists
- ✅ CSRF protection with state parameter
- ✅ Secure token storage
- ✅ Works with both login and registration

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches your application URL
- Check that `NEXT_PUBLIC_APP_URL` is set correctly

### Error: "invalid_client"
- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure OAuth consent screen is configured

### Error: "access_denied"
- User may have denied permissions
- Check OAuth consent screen configuration

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth credentials for development and production
- The state parameter prevents CSRF attacks
- Tokens are stored securely in httpOnly cookies

