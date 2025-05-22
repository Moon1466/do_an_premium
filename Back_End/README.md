# Backend API

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── services/        # Business logic
├── constants/       # Constants
└── app.js           # Application entry point
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create .env file and set environment variables:

```bash
cp .env.example .env
```

3. Run the application:

```bash
npm start
```

## Development

- `npm run dev`: Run in development mode with hot reload
- `npm run test`: Run tests
- `npm run lint`: Run linter
