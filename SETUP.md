# Quick Setup Guide

## Option 1: Docker (Recommended)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

4. **Access:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Option 2: Manual Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Backend

```bash
cd backend
npm install
```

Create `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=resume_analyzer
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-key-here
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Create database:
```bash
createdb resume_analyzer
```

Start:
```bash
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## First Steps

1. Open http://localhost:3000
2. Register a new account
3. Upload one or more PDF resumes
4. View parsed data and visualizations

## Troubleshooting

- **Database connection error**: Ensure PostgreSQL is running
- **File upload fails**: Check `uploads` directory exists in backend
- **AI parsing not working**: Verify OpenAI API key is set (optional - fallback parsing will work)

