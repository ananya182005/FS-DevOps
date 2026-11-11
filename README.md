# Live Task Board

A shared task board built with **React (Vite), Node.js/Express, PostgreSQL, Redis, and Socket.IO WebSockets**. Add, edit, move, and delete tasks; other browser tabs update immediately. This repository also includes **Docker containerization and a Jenkins CI pipeline** for a Windows-based local deployment.

## Requirements

- Git and Node.js (LTS) for local development and tests
- Docker Desktop with the Linux/WSL2 engine running (for Compose)
- For CI: Jenkins with Pipeline and Git plugins, a **Windows agent labeled `windows-docker`**, PowerShell, Git, and Docker CLI/Compose; the agent account must have permission to access the running Docker Engine

## Project layout

```text
live-task-board/
├── backend/
│   ├── Dockerfile                 # Node.js API image; initializes DB at startup
│   ├── .dockerignore
│   ├── src/                       # Express API, Redis, Socket.IO
│   ├── db/schema.sql
│   ├── scripts/initDb.js
│   ├── tests/tasks.test.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── Dockerfile                 # Vite build, served by Nginx
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── src/
│   ├── .env.example
│   └── package.json
├── docker-compose.yml            # Frontend, API, PostgreSQL, Redis
├── Jenkinsfile                   # Checkout → Build → Deploy
├── .env.example                  # Optional Compose settings
├── API.md                        # REST API and Socket.IO events
└── README.md
```

## Option A: Build and run the complete app with Docker (recommended)

Run these commands in PowerShell **from the project root**. Docker Desktop must be running.

```powershell
docker compose build
docker compose up -d
docker compose ps
```

Expected: `frontend`, `backend`, `postgres`, and `redis` are running; PostgreSQL and Redis report `healthy`. The backend initializes the `tasks` table automatically on startup (safe to repeat).

Open:

- **Frontend:** http://localhost:5173
- **API health:** http://localhost:4000/api/health
- **Task list:** http://localhost:4000/api/tasks

Expected health response once ready:

```json
{"status":"ok","db":"up","redis":"up"}
```

First startup can take a little longer while images are built and PostgreSQL becomes healthy. Inspect logs with `docker compose logs -f backend` or `docker compose logs -f frontend`.

Stop the stack while retaining PostgreSQL data:

```powershell
docker compose down
```

**Warning:** `docker compose down -v` also deletes the PostgreSQL data volume and your saved tasks.

**Existing installation:** If you previously ran the backend and Vite using `npm run dev`, stop those terminals first so ports 4000 and 5173 are free. Compose uses the same PostgreSQL data volume/project name when started from the same folder; don't run two competing Compose stacks.

## Option B: Run React and Express locally (Docker only for data services)

From the project root:

```powershell
docker compose up -d postgres redis
```

In a separate PowerShell window:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run db:init
npm run dev
```

In another PowerShell window (from the project root):

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The backend runs at `http://localhost:4000`, the Vite frontend at `http://localhost:5173`. The backend `.env.example` configures the database and Redis at localhost for this mode.

## Verify the features

1. Open `http://localhost:5173` in two tabs. Create a task in one tab; it appears in the other without a refresh. Change its status, edit its title, or delete it and verify both tabs update.
2. Check the **Live / Disconnected** indicator and connected user count.
3. In Chrome DevTools → Network, request `http://localhost:4000/api/tasks` twice within 60 seconds. The second successful request should include `X-Cache: HIT` (first request may be `MISS`). A task mutation invalidates the cache.
4. Run the automated backend tests with PostgreSQL and Redis running. For tests, use **Option B data services** and stop any separate backend process on port 4000 if needed:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm test
```

The suite covers health, validation, CRUD, Redis caching, and WebSocket broadcast. API details are in [API.md](API.md).

## Jenkins CI: Checkout → Build → Deploy (local)

The [`Jenkinsfile`](Jenkinsfile) implements the three required stages on a **Windows Jenkins agent** with label `windows-docker`.

| Stage | What it does |
| --- | --- |
| **Checkout** | `checkout scm` fetches the configured Git repository and checks out the selected branch/commit. |
| **Build** | `docker compose build` builds the backend Node.js image and frontend Vite/Nginx image. Dependencies are installed inside the image builds. |
| **Deploy** | Copies `docker-compose.yml` to the predefined local path `C:\deploy\live-task-board`, then runs `docker compose up -d --no-build --remove-orphans` using the images built in the previous stage. Starts PostgreSQL, Redis, backend, and frontend. |

### Jenkins setup (Windows)

1. Install Jenkins, the **Pipeline** and **Git** plugins, and configure a Windows build agent labeled **`windows-docker`**. Git, PowerShell, Docker CLI, and `docker compose` must work **as the Jenkins agent account**. If Jenkins runs as a Windows service, Docker Desktop access may require running the agent interactively as the Docker Desktop user or configuring suitable engine access.
2. Start Docker Desktop and check `docker version` and `docker compose version` in a terminal running as the agent account.
3. Push this project to a GitHub repository (commands below).
4. In Jenkins choose **New Item → Pipeline**. Under **Pipeline → Definition**, select **Pipeline script from SCM**, select **Git**, enter the repository URL (and credentials if private), set the branch (e.g. `*/main`), and set **Script Path** to `Jenkinsfile`.
5. Click **Build Now** and inspect the console output. You should see successful **Checkout**, **Build**, and **Deploy** stages.
6. Confirm the deployed compose file exists at `C:\deploy\live-task-board\docker-compose.yml`; open http://localhost:5173 and http://localhost:4000/api/health **on the deployment machine**.

**Change the predefined deployment path:** Edit `DEPLOY_PATH` in `Jenkinsfile` before committing if your internship provides a different Windows path. The Jenkins agent must be able to write there. This is a **local deployment**, not a cloud deployment; `localhost` in the browser means the machine running Docker. The frontend image builds with API URL `http://localhost:4000`; adjust `VITE_API_URL` build argument and backend `CLIENT_URL` if deploying for remote browser access.

**CI limitations:** The requested pipeline has three stages and does not include a separate test stage. Run `npm test` as described above before submission. The Compose defaults use development credentials; for a shared or public deployment, configure secure credentials and avoid exposing database/cache ports beyond localhost.

## Git commands (required for assignment commits)

Use PowerShell from the project root. Create an **empty** GitHub repository first, then run:

```powershell
git init
git add .
git status
git commit -m "Add Dockerfiles, full-stack Compose, and Jenkins CI pipeline"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/live-task-board.git
git push -u origin main
```

If this project is **already a Git repository**, do **not** run `git init` or `git remote add origin` again. Instead:

```powershell
git add backend/Dockerfile backend/.dockerignore frontend/Dockerfile frontend/.dockerignore frontend/nginx.conf docker-compose.yml Jenkinsfile README.md .env.example
git status
git commit -m "Add Docker deployment and Jenkins CI pipeline"
git push origin main
```

Before committing, check that `.env`, `node_modules`, and other secrets are excluded by `.gitignore`. The files in this ZIP are not automatically committed to your own repository; **you must run the Git commands yourself**.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Docker Engine stopped / WSL timeout | Restart Docker Desktop, run `wsl --shutdown` in PowerShell, reopen Docker Desktop. |
| Port 4000 or 5173 in use | Stop the existing `npm run dev` processes before starting the full Compose stack. |
| API reports DB/Redis down | `docker compose ps` and `docker compose logs postgres redis backend`. |
| Frontend shows Disconnected | Check backend logs and `http://localhost:4000/api/health`; confirm WebSocket access to port 4000. |
| `X-Cache` is missing | Request `/api/tasks` and inspect its response headers, not `/`. |
| Jenkins cannot access Docker | Verify Docker Desktop is running and the Jenkins **agent account** has engine access. |
| Jenkins agent not found | Set the agent label to `windows-docker`, or edit the label in `Jenkinsfile`. |
| Images fail to build | Inspect Jenkins console logs, confirm internet access to npm and Docker registries. |

## Submission checklist

- [ ] Git repository includes `backend/Dockerfile` and `frontend/Dockerfile`
- [ ] Git repository includes `docker-compose.yml`, `Jenkinsfile`, `README.md`, and `API.md`
- [ ] `docker compose up -d --build` starts all four services
- [ ] Jenkins Checkout, Build, Deploy stages succeed on the configured Windows agent
- [ ] Local deployment is reachable at port 5173 and API at port 4000
- [ ] Git commits and push performed with Git commands
