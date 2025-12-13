# Skribble — Real-time Collaborative Drawing Board

Skribble is a collaborative drawing board that lets multiple users draw together in real time. It supports user registration and login, sharing canvases with other users, and live synchronization via WebSockets (Socket.IO). Canvases are persisted in MongoDB so collaborators can return to their work.

---

## Key Features

- Real-time drawing sync across multiple users using Socket.IO
- User authentication (register / login) using JWT
- Create, list, load, update, share/unshare, and delete canvases
- Canvas data persisted in MongoDB
- React frontend with drawing tools and sharing UI

## Tech Stack

- Frontend: React, Socket.IO Client, Tailwind (dev)
- Backend: Node.js, Express, Socket.IO, Mongoose (MongoDB)
- Auth: JSON Web Tokens (JWT)

## Quick Setup (Local)

Prerequisites: Node.js 16+, MongoDB (local or Atlas)

1. Clone repository

```bash
git clone <repo-url>
cd Skribble
```

2. Start Backend

```bash
cd backend
npm install
# Add a .env with:
# MONGO_URL=your_mongo_connection_string
# SECRET_KEY=your_jwt_secret
# FRONTEND_URL=http://localhost:3000
npm start
```

The backend listens on port `5000` by default.

3. Start Frontend (dev)

```bash
cd frontend
npm install
# Add a .env with (development):
# REACT_APP_NODE_API_URL=http://localhost:5000
npm start
```

Open http://localhost:3000 in your browser.

## API Endpoints

All API endpoints are prefixed with `/api` and many require an `Authorization: Bearer <token>` header.

- `POST /api/users/register` — Register (body: `{ email, password }`)
- `POST /api/users/login` — Login, receive JWT (body: `{ email, password }`)
- `GET /api/users/me` — Get current user details (auth required)

- `POST /api/canvas/create` — Create a canvas (auth)
- `PUT /api/canvas/update` — Update canvas elements (auth)
- `GET /api/canvas/load/:id` — Load a canvas (auth)
- `PUT /api/canvas/share/:id` — Share canvas by email (auth)
- `PUT /api/canvas/unshare/:id` — Unshare canvas (auth)
- `DELETE /api/canvas/delete/:id` — Delete canvas (auth)
- `GET /api/canvas/list` — List user's canvases (auth)

## Socket Events

- Client -> Server

  - `joinCanvas` { canvasId } — Authenticates and joins a room
  - `drawingUpdate` { canvasId, elements } — Broadcast drawing updates

- Server -> Client
  - `loadCanvas` — Initial elements for the canvas
  - `receiveDrawingUpdate` — Updates from other collaborators
  - `unauthorized` — Emitted when access is denied

When `drawingUpdate` is received, the server broadcasts changes to other users in the same canvas room and persists the elements to the database.

## Testing Collaboration Locally

1. Start backend and frontend.
2. Register two users and create a canvas with one user.
3. Share the canvas with the other user's email.
4. Open the canvas in two browsers (or incognito) and draw — changes should sync in near-real time.

## Security & Deployment Notes

- Keep `SECRET_KEY` private — never commit `.env` files.
- Use HTTPS and secure headers in production.
- The backend includes a `vercel.json` for Vercel deployments. Set `MONGO_URL`, `SECRET_KEY`, and `FRONTEND_URL` in your hosting environment.

## Contributing

Contributions welcome. Open issues or PRs for improvements, bug fixes, or feature requests.
