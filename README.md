# UniMart - Node.js & MongoDB Edition

A student-to-student marketplace with real-time chat functionality, migrated to Node.js and MongoDB.

## Features
- **Authentication**: Secure JWT-based login and signup
- **Marketplace**: Buy and sell products with image support
- **Real-time Chat**: Instant messaging between buyers and sellers using Socket.IO
- **Shopping Cart**: Local storage based cart system
- **Responsive Design**: Beautiful pastel-themed UI

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Real-time**: Socket.IO
- **Frontend**: Static HTML, CSS, Vanilla JavaScript
- **Deployment**: Vercel Ready

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account

### 2. Installation
```bash
# Install dependencies
npm install
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=3000
```

### 4. Running Locally
```bash
# Start development server
npm run dev
```
Visit `http://localhost:3000`

## Deployment to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Set Environment Variables in Vercel Dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`

## Project Structure
```
deploy/
├── server/                 # Backend Logic
│   ├── config/            # Database config
│   ├── middleware/        # Auth middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── utils/             # Helpers (JWT)
│   └── index.js           # Main server entry
├── public/                 # Frontend Assets
│   ├── js/                # Client-side logic
│   ├── *.html             # Static pages
│   └── *.css              # Styles
├── vercel.json            # Deployment config
└── package.json           # Dependencies
```
