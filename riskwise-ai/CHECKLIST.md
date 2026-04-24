# Chatbot Implementation Checklist

## ✅ Pre-Setup (Before Starting)

- [ ] Read [QUICKSTART.md](./QUICKSTART.md) (5 min read)
- [ ] Ensure Node.js 18+ installed (`node --version`)
- [ ] Have Supabase project ready
- [ ] Have Google account for Gemini API

## ✅ Installation (5 minutes)

### Install Dependencies
- [ ] Run `npm install @google/generative-ai`
- [ ] Verify no errors: `npm list @google/generative-ai`

### Get Gemini API Keys
- [ ] Go to https://aistudio.google.com/app/apikey
- [ ] Create API Key 1
- [ ] Create API Key 2
- [ ] Create API Key 3 (optional but recommended)
- [ ] Create API Key 4 (optional but recommended)
- [ ] Create API Key 5 (optional but recommended)

### Setup Environment Variables
- [ ] Copy `.env.example` to `.env.local` (if not exists)
- [ ] Add `GEMINI_API_KEY_1=your_key_1` to `.env.local`
- [ ] Add `GEMINI_API_KEY_2=your_key_2` to `.env.local`
- [ ] Add other keys (3, 4, 5)
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] **Never commit `.env.local`**

### Database Setup
- [ ] Log into Supabase console
- [ ] Go to SQL Editor
- [ ] Copy SQL from [supabase/chatbot_schema.sql](./supabase/chatbot_schema.sql)
- [ ] Run the SQL
- [ ] Verify `chat_history` table created
- [ ] Verify indexes created
- [ ] Check RLS policies applied

## ✅ Verification (5 minutes)

### Restart Dev Server
- [ ] Stop current `npm run dev` (Ctrl+C)
- [ ] Run `npm run dev` again
- [ ] Check for errors in terminal
- [ ] Browser should load without errors

### Test API Endpoint
- [ ] Open terminal/PowerShell
- [ ] Run: `curl http://localhost:3000/api/chat`
- [ ] Should see JSON response with `available: true`
- [ ] Should show `keysCount: 5` (or your key count)

### Test Chat Function
- [ ] Visit: `http://localhost:3000/chatbot/test-student-id`
- [ ] Type a test message: "Hello!"
- [ ] Click Send button
- [ ] Should see loading indicator
- [ ] Should get response in 2-3 seconds
- [ ] No errors in browser console (F12)

### Test with Real Student
- [ ] Get actual student ID from your database
- [ ] Visit: `http://localhost:3000/chatbot/{real_student_id}`
- [ ] Try message: "How can I improve my risk score?"
- [ ] Should see personalized response

## ✅ Integration (10 minutes)

### Add to Student Dashboard
- [ ] Open `app/student/page.tsx` (or your dashboard)
- [ ] Import Chatbot: `import Chatbot from "@/components/Chatbot";`
- [ ] Add component to render: `<Chatbot studentId={studentId} />`
- [ ] Test that it works
- [ ] Verify styling matches dashboard

### Add Floating Widget (Optional)
- [ ] Import from examples: `import { FloatingChatWidget } from "@/components/ChatbotExamples";`
- [ ] Add to page: `<FloatingChatWidget studentId={studentId} />`
- [ ] Test button appears in bottom-right
- [ ] Test clicking opens chat
- [ ] Test close button works

### Customize (Optional)
- [ ] Edit system prompt in `lib/chatbotService.ts`
- [ ] Change model in `CHATBOT_CONFIG`
- [ ] Modify UI colors in `components/Chatbot.tsx`
- [ ] Update suggestion logic in `lib/chatbotService.ts`

## ✅ Testing (15 minutes)

### Functional Testing
- [ ] Test sending simple message
- [ ] Test typing multiple messages
- [ ] Test conversation history (prev messages context)
- [ ] Test suggestions chips work
- [ ] Test closing and reopening chat
- [ ] Test on mobile (DevTools phone view)

### Error Testing
- [ ] Disconnect internet → send message → should error gracefully
- [ ] Send very long message (1000+ chars) → should work
- [ ] Send empty message → should be blocked
- [ ] Spam messages quickly → should not crash
- [ ] Check browser console for errors

### Data Testing
- [ ] Send message and check database
- [ ] Verify message saved to `chat_history` table
- [ ] Verify student_id matches
- [ ] Verify role is "user" or "assistant"
- [ ] Verify timestamp is recent
- [ ] Fetch messages via `getChatHistory()` server action

### Performance Testing
- [ ] Time first response (cold): should be 2-3 sec
- [ ] Time second response (warm): should be 1-2 sec
- [ ] Send 5 messages quickly: shouldn't lag
- [ ] Open devtools → Network → check response size
- [ ] Response size should be reasonable

## ✅ Documentation (5 minutes)

- [ ] Read [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- [ ] Read relevant section of [CHATBOT.md](./CHATBOT.md)
- [ ] Share [QUICKSTART.md](./QUICKSTART.md) with team
- [ ] Bookmark [SETUP_SUMMARY.md](./SETUP_SUMMARY.md)

## ✅ Pre-Production (1 hour)

### Code Review
- [ ] Review all chatbot files
- [ ] Check TypeScript compilation: `npm run build`
- [ ] Run linter: `npm run lint`
- [ ] No TypeScript errors
- [ ] No console warnings

### Security Review
- [ ] API keys only in .env.local
- [ ] .gitignore includes .env.local
- [ ] No API keys in code files
- [ ] Error messages don't expose internals
- [ ] Student can only see own chat history
- [ ] Consider field-level encryption in future

### Performance Review
- [ ] Test with 10 concurrent users
- [ ] Check database query performance
- [ ] Monitor API response times
- [ ] Test with various student profiles
- [ ] Consider caching improvements

### Deployment Setup
- [ ] Get deployment platform ready (Vercel/Railway/etc)
- [ ] Set environment variables on platform
- [ ] Test deployment build locally: `npm run build`
- [ ] Run production build: `npm start`
- [ ] Test full flow on staging

## ✅ Deployment (30 minutes)

### Before Deploying
- [ ] All tests passing
- [ ] No open console errors
- [ ] All documentation updated
- [ ] Team reviewed changes
- [ ] Backup plan if issues arise

### Deploy to Production
- [ ] Push code to main/production branch
- [ ] Set environment variables on platform
- [ ] Deploy
- [ ] Monitor for errors
- [ ] Test in production

### Post-Deployment
- [ ] Test all features work
- [ ] Check database connectivity
- [ ] Monitor error logs
- [ ] Get team to test
- [ ] Monitor API usage/costs

## ✅ Launch (5 minutes)

### Announce Features
- [ ] Post about chatbot in student channel
- [ ] Share how to access: `/chatbot/{studentId}`
- [ ] Share what it can help with
- [ ] Share quick tips: "Ask about risk score, assignments, attendance"
- [ ] Provide support contact

### Training (Optional)
- [ ] Create demo video (30 sec)
- [ ] Write guide for students
- [ ] Host Q&A session
- [ ] Answer early questions

## ✅ Post-Launch (Daily for 1 week)

### Monitor
- [ ] [ ] Day 1: Check error logs
- [ ] [ ] Day 2: Monitor API costs/usage
- [ ] [ ] Day 3: Review student feedback
- [ ] [ ] Day 4: Check database size
- [ ] [ ] Day 5: Monitor response times
- [ ] [ ] Day 6: Gather success metrics
- [ ] [ ] Day 7: Plan improvements

### Support
- [ ] [ ] Answer student questions
- [ ] [ ] Fix any bugs
- [ ] [ ] Improve system prompts
- [ ] [ ] Optimize slow responses
- [ ] [ ] Collect metrics

## ✅ Optimization (Ongoing)

### Performance
- [ ] [ ] Monitor response times
- [ ] [ ] Optimize database queries
- [ ] [ ] Add caching where beneficial
- [ ] [ ] Consider batching API calls

### Quality
- [ ] [ ] Improve system prompts
- [ ] [ ] Collect student feedback
- [ ] [ ] A/B test different prompts
- [ ] [ ] Refine suggestions logic

### Features
- [ ] [ ] Add voice input
- [ ] [ ] Add multi-language
- [ ] [ ] Add download reports
- [ ] [ ] Add mentor integration

## ✅ Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| "No API keys found" | Check `.env.local` has `GEMINI_API_KEY_1` |
| Chat shows errors | Check browser console (F12) for details |
| Database errors | Verify schema ran, check Supabase logs |
| Slow responses | Check Gemini status, try different key |
| 401 Errors | Verify API keys are valid and not expired |
| Can't see messages saving | Check RLS policies, verify foreign key |

## Done! 🎉

If you checked all boxes, your chatbot is:
- ✅ Installed
- ✅ Configured
- ✅ Tested
- ✅ Integrated
- ✅ Deployed
- ✅ Ready for students

**Estimated time to complete:** 1-2 hours

For help:
- 📖 See [QUICKSTART.md](./QUICKSTART.md)
- 📖 See [CHATBOT.md](./CHATBOT.md)
- 🧪 See [lib/chatbotDemo.ts](./lib/chatbotDemo.ts)

---

**Happy tutoring! 🚀**
