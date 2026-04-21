# CHITTI BACKEND — DEPLOYMENT INSTRUCTIONS
## For DeepSeek to implement

### STEP 1 — Install dependencies
```
npm install
```

### STEP 2 — Create .env file
Copy .env.example to .env
Fill in all API keys

### STEP 3 — Test locally
```
npm start
```
Test: curl http://localhost:3000/

### STEP 4 — Deploy to Railway
1. Go to railway.app
2. New Project → Deploy from GitHub
3. Connect: github.com/bryantechub/chitti-backend
4. Add environment variables from .env
5. Railway auto-deploys

### STEP 5 — Update chitti_complete.html
Replace this line:
const API_BASE = 'https://chitti-backend.railway.app';
With your actual Railway URL.

### STEP 6 — Test endpoints
GET  /                          → Health check
POST /api/chat                  → Chat with Chitti
GET  /api/weather?city=Indore   → Weather
GET  /api/news?interest=finance → News
POST /api/feedback              → Send to War Room
POST /api/whatsapp              → Send WhatsApp
POST /api/morning-brief         → Generate brief

### STEP 7 — Free API Keys needed
1. OpenWeatherMap: openweathermap.org/api (free)
2. NewsAPI: newsapi.org (free, 100 calls/day)
3. Twilio WhatsApp sandbox: twilio.com (free testing)
4. Make.com webhook: make.com (free tier)

### TOTAL MONTHLY COST AT CURRENT SCALE: ~₹0
(All free tiers sufficient for first 100 users)
