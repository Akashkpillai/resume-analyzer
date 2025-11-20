# Resume Analyzer - Full-Stack Web Application

A comprehensive full-stack web application for analyzing resumes with AI-powered parsing, visualization, and search capabilities.

## Features

### Frontend
- ✅ React with TypeScript
- ✅ Upload resumes in PDF format (multiple upload support)
- ✅ Clean dashboard displaying parsed resume details
- ✅ Visualizations (skill frequency charts, experience timeline)
- ✅ Keyword highlighting in raw text
- ✅ Search and filter functionality
- ✅ Responsive design with Tailwind CSS
- ✅ JWT-based authentication

### Backend
- ✅ NestJS with TypeScript
- ✅ RESTful API endpoints
- ✅ AI-powered resume parsing (GROQ or fallback parsing)
- ✅ PostgreSQL database with TypeORM
- ✅ File upload handling (PDF only)
- ✅ JWT authentication
- ✅ Pagination support
- ✅ Search and filter by skills/experience

### AI Integration
- ✅ GROQ API integration for intelligent parsing
- ✅ Fallback regex-based parsing when API key is not available
- ✅ Extracts: name, email, phone, skills, experience, education, projects
- ✅ Returns structured JSON data

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (for visualizations)
- React Router
- Axios
- Global HR requirement filtering with protected routes

**Backend:**
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT (Passport)
- Multer (file uploads)
- pdf-parse (PDF extraction)
- GROQ API

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized setup)
- PostgreSQL 15+ (if running without Docker)
- GROQ API key (optional, for AI parsing)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   cd resume-analyser
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the root directory (optional for Docker, as docker-compose.yml has defaults):
   ```env
   GROQ_API_KEY=your-GROQ-api-key-here
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 3001
   - Frontend on port 3000

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - **Swagger Documentation**: http://localhost:3001/api

## Manual Setup (Without Docker)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory (or copy from `.env.example`):
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=resume_analyzer
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   GROQ_API_KEY=your-GROQ-api-key-here
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb resume_analyzer
   ```

5. **Run database migrations** (TypeORM will auto-sync in development)
   
6. **Start the backend server**
   ```bash
   npm run start:dev
   ```

   The backend will be available at http://localhost:3001

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   
   Create a `.env` file in the `frontend` directory (or copy from `.env.example`):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

## API Documentation (Swagger)

The backend API includes comprehensive Swagger/OpenAPI documentation. Once the backend is running, you can access it at:

**Swagger UI**: http://localhost:3001/api

The Swagger documentation provides:
- Interactive API testing interface
- Complete endpoint descriptions
- Request/response schemas
- Authentication testing with JWT tokens
- Example requests and responses

### Using Swagger

1. Start the backend server
2. Navigate to http://localhost:3001/api
3. Click "Authorize" button to add your JWT token
4. Test endpoints directly from the Swagger UI

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `GET /auth/profile` - Get current user profile (requires authentication)

### Resumes

- `POST /resumes/upload` - Upload a resume (requires authentication)
  - Content-Type: multipart/form-data
  - Field: `files` (PDF files)

- `GET /resumes` - Get all resumes with pagination (requires authentication)
  - Query params: `page`, `limit`, `search`, `skill`

- `GET /resumes/:id` - Get a specific resume (requires authentication)

- `GET /resumes/stats` - Get statistics (requires authentication)

- `DELETE /resumes/:id` - Delete a resume (requires authentication)

## Project Structure

```
resume-analyser/
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── resume/         # Resume module
│   │   ├── app.module.ts   # Main app module
│   │   └── main.ts         # Application entry point
│   ├── uploads/            # Uploaded resume files
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## Usage

1. **Register/Login**: Create an account or login with existing credentials

2. **Upload Resume**: 
   - Drag and drop PDF files on the dashboard (multiple supported)
   - Or click to select a file
   - The system will automatically parse the resume

3. **View Resumes**: 
   - Browse all uploaded resumes on the dashboard
   - Click on any resume card to view detailed information

4. **Search & Filter**:
   - Use the search bar to find resumes by content
   - Filter by specific skills using the skill filter

5. **View Visualizations**:
   - See skill frequency charts on the dashboard
   - View experience timeline on individual resume pages

6. **Keyword Highlighting**:
   - On the resume detail page, enter keywords to highlight them in the raw text

## AI Parsing

The application uses GROQ's GPT-3.5-turbo model to intelligently parse resumes. If an GROQ API key is not provided, it falls back to basic regex-based parsing.

**To enable AI parsing:**
1. Get an GROQ API key from https://platform.GROQ.com/
2. Add it to your `.env` file as `GROQ_API_KEY`

**What gets extracted:**
- Personal information (name, email, phone)
- Skills list
- Work experience (title, company, dates, description)
- Education (degree, institution, year)
- Projects (name, description, technologies)

## Development

### Backend Development

```bash
cd backend
npm run start:dev    # Start with hot reload
npm run build        # Build for production
npm run test         # Run tests
```

### Frontend Development

```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Production Deployment

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Set production environment variables**
   - Update `.env` files with production values
   - Set `NODE_ENV=production`
   - Use a strong `JWT_SECRET`

3. **Run migrations** (if needed)
   - TypeORM will handle schema in production

4. **Start services**
   - Use PM2 or similar process manager for Node.js
   - Or use Docker Compose with production configs

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `createdb resume_analyzer`

### File Upload Issues
- Ensure `uploads` directory exists in backend
- Check file size limits
- Verify file format (PDF only)

### AI Parsing Not Working
- Verify GROQ API key is set correctly
- Check API key has sufficient credits
- System will fallback to basic parsing if API fails

### CORS Issues
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Check CORS settings in `main.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on the repository.

