# Chatbot Integration & Setup Guide

## Overview

The RiskWise AI chatbot is an intelligent academic assistant powered by Google's Gemini API. It helps students:
- Understand their academic risk factors
- Receive personalized recommendations to lower risk scores
- Get study strategies and time management tips
- Track progress and celebrate achievements

## Architecture

### Key Components

1. **API Key Rotator** (`lib/apiKeyRotator.ts`)
   - Manages multiple API keys to bypass rate limits
   - Automatically cycles through keys
   - Fallback mechanism for single key setup

2. **Chatbot Service** (`lib/chatbotService.ts`)
   - Integrates with Gemini API
   - Manages conversation history
   - Generates context-aware responses
   - System prompt customization
`
3. **Server Actions** (`actions/chatbotActions.ts`)
   - Fetches student academic context
   - Saves chat history to database
   - Generates personalized reports

4. **API Route** (`app/api/chat/route.ts`)
   - REST endpoint for chat requests
   - Handles authentication and validation

5. **Chatbot Component** (`components/Chatbot.tsx`)
   - Beautiful React UI
   - Real-time message streaming
   - Suggestion chips
   - Error handling

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @google/generative-ai
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your Gemini API keys:

```env
GEMINI_API_KEY_1=AIzaSyDIXYs9UEDrEtFHjpmh-u7bWuYtVaObQls
GEMINI_API_KEY_2=AIzaSyAHkl8gym7IcUAK0um2fvzUp7AMypXr4es
GEMINI_API_KEY_3=AIzaSyATF69_fM5jPFrZLwCAoY-g-zWkuGCbTUQ
GEMINI_API_KEY_4=AIzaSyA8h9Fib3lHx5LUyhlM1IhYwfX7o-M7vaY
GEMINI_API_KEY_5=AIzaSyBiBUX6BygGcArGBgP27sscvK1WFzOVO48
```

**Get API Keys:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Create a new API key in Google Cloud Console
4. Copy and paste into .env.local

### 3. Database Setup

Add a `chat_history` table to Supabase:

```sql
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_history_student_id ON chat_history(student_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);
```

### 4. Usage

#### In Components

```tsx
import Chatbot from "@/components/Chatbot";

export default function ChatbotPage({ params }: { params: { studentId: string } }) {
  return (
    <div className="h-screen">
      <Chatbot studentId={params.studentId} />
    </div>
  );
}
```

#### API Usage

```typescript
// Fetch chat response
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    studentId: "student_123",
    message: "How can I improve my attendance?",
    conversationHistory: [], // Optional
  }),
});

const data = await response.json();
console.log(data.reply);
```

#### Server Actions

```typescript
import { handleChatMessage, getStudentContext } from "@/actions/chatbotActions";

// Get student context
const context = await getStudentContext("student_123");

// Handle chat message
const response = await handleChatMessage({
  studentId: "student_123",
  message: "What are my risk factors?",
});
```

## System Prompt

The chatbot uses a dynamic system prompt that includes:
- Student's current risk score and category
- Attendance percentage
- Average marks
- Pending assignments
- Top risk reasons

This ensures responses are highly personalized and actionable.

## Features

### 1. Context-Aware Responses
- Pulls real student data
- Generates tailored advice
- Considers risk category

### 2. Smart Suggestions
- Dynamic suggestion chips based on student profile
- Encourages specific actions
- Easy re-engagement

### 3. Risk Insights
- Current risk score
- Recommendations tied to data
- Actionable next steps

### 4. Message History
- Persists to Supabase
- Used for context in subsequent messages
- Max 10 messages fetched for context

### 5. Rate Limiting Protection
- Multiple API key rotation
- Automatic cycling
- Fallback mechanisms

## Rate Limiting

With rate limit rotation:
- 5 API keys = ~300 requests/minute capacity
- Automatic key cycling per request
- Degradation handled gracefully

## Error Handling

Chatbot gracefully handles:
- Missing environment variables
- API rate limits
- Network errors
- Database unavailability
- Invalid student IDs

Provides helpful fallback messages and suggests alternatives.

## Monitoring

Check chatbot health:

```typescript
import { getChatbotStatus } from "@/actions/chatbotActions";

const status = await getChatbotStatus();
console.log(`Available keys: ${status.keysCount}`);
console.log(`Service status: ${status.available ? "✅ OK" : "❌ Error"}`);
```

Or via API:

```bash
curl http://localhost:3000/api/chat
```

## Best Practices

1. **Always provide studentId** - Critical for personalization
2. **Batch conversation history** - Don't send entire history for performance
3. **Cache student context** - Fetch once per session when possible
4. **Monitor API usage** - Track key rotation frequency
5. **Test with real data** - Use production-like student profiles
6. **Implement retry logic** - Some failures are transient

## Customization

### Change Model

Edit `lib/chatbotService.ts`:

```typescript
const CHATBOT_CONFIG = {
  modelName: "gemini-2.0-flash", // Or gemini-pro, etc.
  temperature: 0.7,
  maxTokens: 1024,
};
```

### Modify System Prompt

Edit `buildSystemPrompt()` in `lib/chatbotService.ts`:

```typescript
function buildSystemPrompt(context?: StudentContext): string {
  return `Your custom prompt here`;
}
```

### Customize Suggestions

Edit `generateSuggestions()` in `lib/chatbotService.ts`:

```typescript
function generateSuggestions(context?: StudentContext): string[] {
  // Custom logic
}
```

## Deployment

### Environment Setup

On Vercel/Railway/etc:
1. Set environment variables in deployment platform
2. Ensure Supabase credentials are accessible
3. Add Gemini API keys (use at least 3-5 for production)

### Database Migrations

Run the SQL schema on production Supabase:

```sql
-- Already included in setup section above
```

## Troubleshooting

### "No API keys found"
- Check .env.local exists
- Verify key names match `GEMINI_API_KEY_1`, etc.
- Check for whitespace issues

### "Failed to fetch student context"
- Verify student ID is correct
- Check Supabase credentials
- Ensure tables exist

### Rate limit errors
- Add more API keys (currently: 5)
- Reduce request frequency
- Implement client-side debouncing

### Chat not saving to database
- Check `chat_history` table exists
- Verify Supabase insert permissions
- Check student_id foreign key constraints

## Future Enhancements

- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Integration with mentor notifications
- [ ] Custom training on school data
- [ ] Offline mode support
- [ ] Progressive web app
