# NYRA - Your Personal Health Companion

A modern health and wellness chatbot built with Next.js, Supabase, and OpenAI.

## Features

- 🔐 **Google Authentication** - Secure sign-in with Google OAuth
- 💬 **AI-Powered Chat** - Personalized health guidance using GPT-4o-mini
- 👤 **User Profiles** - Store and manage health personas
- 📱 **Responsive Design** - Beautiful UI with light/dark mode
- 🗂️ **Chat History** - Save and manage multiple conversations
- 🎯 **Intent-Based Actions** - Quick access to muscle building, diet plans, and more

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **AI**: OpenAI GPT-4o-mini

## Prerequisites

- Node.js 18+ and npm
- A Supabase account
- An OpenAI API account

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public key
3. Go to **SQL Editor** and run the schema from `supabase-schema.sql`
4. Enable Google OAuth:
   - Go to **Authentication > Providers**
   - Enable Google provider
   - Add your Google OAuth credentials (get from [Google Cloud Console](https://console.cloud.google.com))
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add billing information (required for GPT-4o-mini)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 5. Run the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Database Schema

The app uses four main tables:

- **users**: User profiles with Google OAuth info
- **personas**: Health profiles (age, weight, diet preferences, etc.)
- **chats**: Chat conversations
- **messages**: Individual messages in chats

Row Level Security (RLS) is enabled to ensure users can only access their own data.

## Project Structure

```
nyra-final/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts          # OpenAI chat endpoint
│   │   ├── page.tsx                  # Main page (intro, login, chat)
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   └── ChatPage.tsx              # Main chat interface
│   └── lib/
│       └── supabase.ts               # Supabase client & helpers
├── supabase-schema.sql               # Database schema
├── package.json
└── README.md
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

Make sure to set the environment variables in your hosting platform.

## Features Overview

### Authentication
- Single sign-on with Google
- Automatic user profile creation
- Secure session management

### Chat Interface
- Real-time streaming responses
- Message history with auto-save
- Quick action buttons (muscle building, diet plans, etc.)
- Dark/light mode toggle

### Health Persona
- Collect user health data naturally through conversation
- Store preferences: age, weight, diet type, goals, etc.
- Use profile data for personalized AI responses

### AI Prompts
- Conversational Hinglish tone
- Context-aware responses
- Memory of user-shared information
- Structured outputs for plans and recommendations

## Customization

### Changing the AI Model

Edit `src/app/api/chat/route.ts`:

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini", // Change to gpt-4, gpt-4-turbo, etc.
  // ...
});
```

### Updating System Prompt

The AI personality is defined in `src/app/api/chat/route.ts` in the `systemPrompt` variable.

### Styling

- Global styles: `src/app/globals.css`
- Tailwind config: `tailwind.config.js` (uses Tailwind 4's new config format)
- Component styles: Inline with Tailwind utility classes

## Troubleshooting

**OAuth not working?**
- Verify Google OAuth credentials in Supabase
- Check redirect URLs match exactly
- Ensure Google OAuth consent screen is configured

**API errors?**
- Verify OpenAI API key is valid
- Check you have billing enabled on OpenAI
- Verify environment variables are set correctly

**Database errors?**
- Ensure RLS policies are created (run `supabase-schema.sql`)
- Check Supabase connection strings
- Verify tables exist in your database

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
