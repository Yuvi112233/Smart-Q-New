# SmartQueue

A salon queue management system with separate frontend and backend.

## Project Structure

- `client/` - React frontend (Vite)
- `server/` - Express.js backend (Node.js)
- `shared/` - Shared schemas and types

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

This will install dependencies for:
- Root project
- Client (frontend)
- Server (backend)

### Development

#### Option 1: Run both frontend and backend together
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

#### Option 2: Run frontend and backend separately

**Frontend only:**
```bash
npm run dev:client
# or
cd client && npm run dev
```

**Backend only:**
```bash
npm run dev:server
# or
cd server && npm run dev
```

### Production

1. Build both frontend and backend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=5000
NODE_ENV=development

# Frontend (for production)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

The backend API is available at `http://localhost:5000/api/*`

The frontend will proxy API requests to the backend automatically in development.

## Development Workflow

1. The frontend runs on port 3000 with hot reload
2. The backend runs on port 5000 with nodemon for auto-restart
3. API requests from frontend are proxied to backend
4. CORS is configured to allow frontend-backend communication

## Scripts

### Root level scripts:
- `npm run dev` - Start both frontend and backend in development
- `npm run dev:client` - Start only frontend
- `npm run dev:server` - Start only backend
- `npm run build` - Build both frontend and backend
- `npm run install:all` - Install dependencies for all packages

### Client scripts:
- `cd client && npm run dev` - Start frontend development server
- `cd client && npm run build` - Build frontend for production
- `cd client && npm run preview` - Preview production build

### Server scripts:
- `cd server && npm run dev` - Start backend with nodemon
- `cd server && npm run build` - Build backend for production
- `cd server && npm start` - Start production backend
