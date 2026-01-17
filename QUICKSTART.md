# BlockView Quick Start Guide

Get BlockView running in under 5 minutes.

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 20+ | `node --version` |
| MongoDB | 6.0+ | `mongod --version` |
| yarn | 1.22+ | `yarn --version` |

---

## 🚀 Quick Setup

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/your-org/blockview.git
cd blockview

# Install backend dependencies
cd backend && yarn install && cd ..

# Install frontend dependencies
cd frontend && yarn install && cd ..
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

**Edit `backend/.env`:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=blockview
MONGODB_URI=mongodb://localhost:27017/blockview
CORS_ORIGINS=*
ENS_ENABLED=true
WS_ENABLED=true
TELEGRAM_BOT_TOKEN=your_token  # Get from @BotFather
```

**Edit `frontend/.env`:**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 3. Start Services

**Option A: Manual (3 terminals)**

```bash
# Terminal 1: MongoDB
mongod --dbpath /data/db

# Terminal 2: Backend
cd backend && yarn dev

# Terminal 3: Frontend
cd frontend && yarn start
```

**Option B: Using scripts**

```bash
# Start all services
./scripts/start-dev.sh

# Or with docker-compose (if available)
docker-compose up -d
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:8001/api/health
# Expected: {"ok":true,...}

# Open frontend
open http://localhost:3000
```

---

## 🧪 Test the Flow

### Create Your First Alert

1. **Navigate to Tokens**
   ```
   http://localhost:3000/tokens/0xdac17f958d2ee523a2206206994597c13d831ec7
   ```
   This is USDT (Tether) on Ethereum.

2. **Click "Create Alert"**
   - Select trigger types (e.g., Accumulation)
   - Enable notification channels
   - Click "Create Alert"

3. **View Your Alert**
   ```
   http://localhost:3000/alerts
   ```
   Your new alert should appear in the list.

### Connect Telegram (Optional)

1. Start your Telegram bot (@your_bot)
2. Go to any Token page
3. Click "Create Alert" → Enable Telegram
4. Click "Connect Telegram"
5. Follow the link and send `/start` to the bot

---

## 🔧 Common Issues

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand({ping:1})"

# Start MongoDB
mongod --dbpath /data/db
```

### Backend Won't Start

```bash
# Check logs
tail -f backend/logs/app.log

# Rebuild
cd backend && yarn build
```

### Frontend Shows Blank Page

```bash
# Check API connection
curl http://localhost:8001/api/health

# Verify env var
grep REACT_APP_BACKEND_URL frontend/.env
```

### Port Already in Use

```bash
# Find process on port
lsof -i :8001
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 📁 Project Structure (Quick Reference)

```
blockview/
├── backend/
│   ├── src/
│   │   ├── core/alerts/     # Alert system
│   │   ├── core/watchlist/  # Watchlist
│   │   └── core/tokens/     # Token data
│   └── .env                 # Backend config
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # UI components
│   │   └── api/             # API client
│   └── .env                 # Frontend config
│
└── README.md                # Full documentation
```

---

## 📚 Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
4. Review [CHANGELOG.md](CHANGELOG.md) for version history

---

## 🆘 Need Help?

- **Issues**: Open a GitHub issue
- **Docs**: Check `/docs` folder
- **API**: See API endpoints in README

---

*Happy building! 🚀*
