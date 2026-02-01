# Collab Canvas

A real-time collaborative drawing canvas where multiple users can draw together in the same room.

## Features

- **Room System**: Create a room and share the link with friends
- **Drawing Tools**: Pen and Eraser
- **Color Picker**: Choose any stroke color
- **Clear Canvas**: Wipe the entire canvas
- **Real-time Collaboration**: See others draw instantly via WebSockets
- **User Count**: See how many users are connected

## Tech Stack

**Frontend:**

- React + TypeScript
- react-konva (canvas)
- Tailwind CSS
- socket.io-client

**Backend:**

- Node.js
- Express
- Socket.io

## Getting Started

### 1. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

Or install separately:

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Start the Server

In one terminal:

```bash
npm run dev:server
```

The server will run on `http://localhost:3001`

### 3. Start the Frontend

In another terminal:

```bash
npm run dev
```

The app will run on `http://localhost:5173`

### 4. Start Drawing!

1. Open `http://localhost:5173` in your browser
2. Click "Create Canvas" to create a new room
3. Copy the room link and share it with friends
4. Draw together in real-time!

## User Flow

1. **Landing Page**: Click "Create Canvas" to start
2. **Room Page**: A unique room is created with a shareable URL
3. **Share**: Copy the link and send to friends
4. **Collaborate**: Everyone with the link can draw together

## Project Structure

```
collab-canvas/
├── src/                    # Frontend source
│   ├── pages/
│   │   ├── Landing.tsx     # Landing page
│   │   └── Room.tsx        # Drawing room
│   ├── lib/
│   │   └── socket.ts       # Socket.io client
│   ├── types/
│   │   └── socket.ts       # TypeScript types
│   └── ...
├── server/                 # Backend source
│   ├── index.js            # Express + Socket.io server
│   └── package.json
└── ...
```
