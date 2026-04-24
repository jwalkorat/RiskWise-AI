# Chatbot Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd riskwise-ai
npm install @google/generative-ai
```

### Step 2: Add Environment Variables

Create `.env.local`:

```env
# Existing Supabase keys (already in your .env)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# NEW: Add Gemini API keys
GEMINI_API_KEY_1=AIzaSyDIXYs9UEDrEtFHjpmh-u7bWuYtVaObQls
GEMINI_API_KEY_2=AIzaSyAHkl8gym7IcUAK0um2fvzUp7AMypXr4es
GEMINI_API_KEY_3=AIzaSyATF69_fM5jPFrZLwCAoY-g-zWkuGCbTUQ
GEMINI_API_KEY_4=AIzaSyA8h9Fib3lHx5LUyhlM1IhYwfX7o-M7vaY
GEMINI_API_KEY_5=AIzaSyBiBUX6BygGcArGBgP27sscvK1WFzOVO48
```

**Need API keys?**
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
- Click "Create API Key"
- Copy and paste above

### Step 3: Set Up Database

Go to Supabase Console → SQL Editor → Run:

```sql
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_history_student_id ON chat_history(student_id);
```

### Step 4: Add to Your Page

```tsx
// app/student/[id]/page.tsx
import Chatbot from "@/components/Chatbot";

export default function StudentPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen">
      <Chatbot studentId={params.id} />
    </div>
  );
}
```

### Step 5: Start Server
```bash
npm run dev
```

Visit: `http://localhost:3000/student/123` (replace 123 with any student ID)

## Files Created

```
riskwise-ai/
├── lib/
│   ├── types.ts                 # TypeScript types
│   ├── apiKeyRotator.ts         # API key rotation
│   └── chatbotService.ts        # Gemini integration
├── actions/
│   └── chatbotActions.ts        # Server actions
├── components/
│   ├── Chatbot.tsx              # Chat UI component
│   └── ChatbotExamples.tsx      # Usage examples
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # Chat API endpoint
│   └── chatbot/
│       └── [studentId]/
│           └── page.tsx         # Example page
├── supabase/
│   └── chatbot_schema.sql       # Database schema
├── CHATBOT.md                   # Full documentation
└── QUICKSTART.md                # This file
```

## How It Works

1. **Student sends message** → Chatbot component
2. **Component calls** `/api/chat` endpoint
3. **API fetches** student context from Supabase
4. **Service calls** Gemini API with rotated key
5. **Response saved** to chat_history table
6. **Reply displayed** with suggestions

## Key Features

✅ **Context-Aware** - Pulls real student data
✅ **Rate-Limit Safe** - Automatic key rotation
✅ **Persistent** - Saves all conversations
✅ **Fast** - ~1-2 second response time
✅ **Offline Fallback** - Graceful error handling
✅ **Mobile Friendly** - Responsive UI

## Testing

### Test Endpoint
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "message": "How can I improve my risk score?"
  }'
```

### Test with Your Student
Navigate to:
```
http://localhost:3000/chatbot/YOUR_STUDENT_ID
```

## Common Questions

**Q: Do I need all 5 API keys?**
A: No, 1 key works fine. But 3-5 keys provide better rate limit protection.

**Q: Can I customize the bot's personality?**
A: Yes, edit `buildSystemPrompt()` in `lib/chatbotService.ts`

**Q: Does it work without Supabase?**
A: Yes, but chat history won't be saved. Remove `saveChatMessage()` calls.

**Q: Can I change the Gemini model?**
A: Yes, edit `CHATBOT_CONFIG.modelName` in `lib/chatbotService.ts`

## Troubleshooting

### "No API keys found"
- Check `.env.local` exists
- Verify key names are `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, etc.
- Restart dev server after adding keys

### Chat messages not saving
- Run the SQL schema from Step 3
- Check Supabase credentials in `.env.local`
- Verify `students` table exists (required for foreign key)

### Slow responses
- This is normal (1-3 sec) for first message
- Verify internet connection
- Check Gemini API status

### 401 Unauthorized errors
- Invalid API key in `.env.local`
- Key might be expired (check Google console)
- Rate limited - add more keys

## Next Steps

1. ✅ Add it to student dashboard
2. ✅ Customize system prompt for your needs
3. ✅ Monitor usage and success rates
4. ✅ Gather student feedback
5. ✅ Integrate with mentor notifications

## Support

For issues:
1. Check `CHATBOT.md` for detailed docs
2. Review error logs in browser console
3. Check `/api/chat` response (F12 → Network tab)
4. Verify `.env.local` variables

---

**Happy tutoring! 🚀**
