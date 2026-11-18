# KeylessFlow API

Hotel guest management backend built with Node.js, Express 5 and MongoDB (Mongoose).

## Getting started

```bash
npm install
cp .env.example .env   # then edit values if needed
npm run dev            # starts with nodemon on http://localhost:5000
```

You need a running MongoDB instance: either local (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string in `MONGO_URI`. The database name comes from `DB_NAME` (default `keylessflow`).

## Scripts

| Command       | What it does                       |
| ------------- | ---------------------------------- |
| `npm run dev` | Start with auto-reload (nodemon)   |
| `npm start`   | Start with plain Node (production) |

## Project structure

```
server.js                 Entry point: connects to MongoDB, then starts the server
app.js                    Express app: middleware, routes, error handling
config/env.js             Loads and validates environment variables
config/db.js              Mongoose connection to the keylessflow database
models/                   Mongoose schemas (Guest)
controllers/              Route handlers
routes/                   Route definitions, mounted under /api
middlewares/              404 and central error handler
utils/ApiError.js         Error class with HTTP status codes
```

## Endpoints

| Method | Path              | Description                                               |
| ------ | ----------------- | --------------------------------------------------------- |
| GET    | `/api/health`     | API and database status                                   |
| GET    | `/api/guests`     | List guests (`?page=1&limit=20&search=name/email/phone`) |
| POST   | `/api/guests`     | Create a guest                                            |
| GET    | `/api/guests/:id` | Get one guest                                             |
| PATCH  | `/api/guests/:id` | Update a guest                                            |
| DELETE | `/api/guests/:id` | Delete a guest                                            |

Example:

```bash
curl -X POST http://localhost:5000/api/guests \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ada","lastName":"Obi","email":"ada@example.com","phone":"+2348012345678"}'
```

## Adding a new resource

1. Create the schema in `models/` (e.g. `room.model.js`).
2. Add handlers in `controllers/`. Express 5 catches errors thrown in async handlers, so you can `throw ApiError.notFound()` without try/catch.
3. Define routes in `routes/` and mount them in `routes/index.js`.
