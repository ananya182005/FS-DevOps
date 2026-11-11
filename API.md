# Live Task Board API

Base URL: `http://localhost:4000`. All request and response bodies are JSON. Errors use `{ "error": "message" }`.

## Health
**GET `/api/health`** — `200`:
```json
{ "status": "ok", "db": "up", "redis": "up" }
```
`db` and `redis` can independently be `down`. The API remains available without Redis, but task operations require PostgreSQL.

## List tasks
**GET `/api/tasks`** — `200`:
```json
[{"id":1,"title":"Write README","description":"Explain setup","status":"todo","created_at":"2026-01-01T10:00:00.000Z","updated_at":"2026-01-01T10:00:00.000Z"}]
```
Newest first. Response header `X-Cache: MISS` on a database read or `X-Cache: HIT` on a Redis read. Cache key `tasks:all`, TTL 60 seconds. With Redis unavailable the header remains `MISS`.

## Get a task
**GET `/api/tasks/:id`** — `200`: task object as above. `400` invalid id; `404` `{ "error": "Task not found" }`; `500` server/database error.

## Create a task
**POST `/api/tasks`**
```json
{"title":"Write README","description":"Explain setup","status":"todo"}
```
`201`: the created task object (including generated id and timestamps). `400`: missing/blank/overlong title, invalid description/status or unknown field; `500`: server error. Description and status are optional.

## Update a task
**PUT `/api/tasks/:id`**
```json
{"title":"Update README","description":"Include troubleshooting","status":"in_progress"}
```
All fields optional, but supply at least one. `200`: updated task object. `400`: invalid id, status, field or title; `404`: missing task; `500`: server error. Explicit `description: null` clears the description.

## Delete a task
**DELETE `/api/tasks/:id`** — `200`:
```json
{"id":1}
```
`400`: invalid id; `404`: missing task; `500`: server error.

## WebSocket events
Connect to `http://localhost:4000` using Socket.IO with `transports: ['websocket']`. The server restricts CORS to `CLIENT_URL`.

| Event | Direction | Payload | When |
|---|---|---|---|
| `task:created` | server → clients | Full task object | After POST succeeds |
| `task:updated` | server → clients | Full task object | After PUT succeeds |
| `task:deleted` | server → clients | Numeric task id, e.g. `1` | After DELETE succeeds |
| `users:count` | server → clients | Number, e.g. `2` | Client connects/disconnects |

Task writes invalidate the Redis list cache before broadcasting. The client also refreshes on socket reconnection to recover missed updates.

## Quick curl examples
```bash
curl http://localhost:4000/api/health
curl -i http://localhost:4000/api/tasks
curl -X POST http://localhost:4000/api/tasks -H 'Content-Type: application/json' -d '{"title":"Learn Redis"}'
curl -X PUT http://localhost:4000/api/tasks/1 -H 'Content-Type: application/json' -d '{"status":"done"}'
curl -X DELETE http://localhost:4000/api/tasks/1
```
