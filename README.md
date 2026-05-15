# TaskFlow — Team Task Manager (Full-Stack)

A production-ready full-stack web app where users can create projects, assign tasks, and track progress with **role-based access (Admin / Member)**. Built with the MERN stack and deployed on Railway.

> **Live Demo:** _[Add your Railway URL here after deployment]_  
> **GitHub:** _[Add your repo URL here]_  
> **Demo Video:** _[Add YouTube/Loom link here]_

---

## ✨ Features

- 🔐 **Authentication** — Signup & login with JWT + bcrypt password hashing
- 👥 **Role-Based Access Control** — `Admin` (manage everything) vs `Member` (work on assigned tasks)
- 📁 **Project & Team Management** — Create projects, invite members by email
- ✅ **Task Management** — Create, assign, prioritize, set due dates, and track status (Todo / In Progress / Done)
- 📊 **Dashboard** — Real-time stats on tasks, status breakdown, overdue items, and personal task queue
- ⏰ **Overdue Tracking** — Auto-detect tasks past their due date
- 🎨 **Modern UI** — Clean SaaS-style design with Tailwind CSS, gradients, and smooth interactions
- 📱 **Responsive** — Works on mobile, tablet, and desktop
- ✓ **Validated APIs** — Input validation via express-validator on every endpoint

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios
- React Hot Toast (notifications)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- express-validator
- CORS, Morgan

**Deployment**
- Railway (single service)
- MongoDB Atlas (free tier)

---

## 📁 Project Structure

```
team-task-manager/
├── server/                  # Express backend
│   ├── config/db.js         # MongoDB connection
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── controllers/         # Route handlers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   ├── role.js          # Role-based access
│   │   └── validate.js      # Input validation
│   ├── server.js            # Entry point
│   └── package.json
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/axios.js     # API instance + interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── ProjectDetail.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json             # Root orchestrator (used by Railway)
├── railway.json
├── nixpacks.toml
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local) **or** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

### 1. Clone & install

```bash
git clone <your-repo-url>
cd team-task-manager
npm run install-all
```

### 2. Configure environment variables

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_long_random_secret_here_change_this
JWT_EXPIRE=7d
```

> For MongoDB Atlas, use the connection string from your cluster (replace `<password>`).

### 3. Run in development

In **two terminals**:

```bash
# Terminal 1 — backend (port 5000)
npm run dev:server

# Terminal 2 — frontend (port 3000, proxies /api → 5000)
npm run dev:client
```

Open http://localhost:3000.

### 4. Run as production locally

```bash
npm run build
NODE_ENV=production npm start
```

App will be served at http://localhost:5000.

---

## ☁️ Deploy to Railway

1. **Push code to GitHub.**

2. **Create a MongoDB Atlas cluster** (free tier):
   - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free M0 cluster
   - Add a database user (Database Access → Add New User)
   - Whitelist all IPs (Network Access → Add IP → `0.0.0.0/0`)
   - Get your connection string: `mongodb+srv://<user>:<pass>@cluster.xxx.mongodb.net/team-task-manager`

3. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
   - Select your repo
   - Add environment variables (Settings → Variables):
     ```
     NODE_ENV=production
     MONGO_URI=<your_atlas_connection_string>
     JWT_SECRET=<a_long_random_string>
     JWT_EXPIRE=7d
     ```
   - Railway auto-detects the `package.json` build/start commands. The build runs `cd client && npm install && npm run build && cd ../server && npm install`, then `npm start` runs the server which serves both the API and the built React app.
   - Once deployed, go to Settings → Networking → **Generate Domain** to get your live URL.

4. **Done!** Your app is live. 🎉

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Body | Access | Description |
|---|---|---|---|---|
| POST | `/auth/signup` | `{ name, email, password, role? }` | Public | Create account |
| POST | `/auth/login` | `{ email, password }` | Public | Login, returns JWT |
| GET | `/auth/me` | — | Authenticated | Get current user |

### Projects

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/projects` | Authenticated | List accessible projects |
| POST | `/projects` | **Admin** | Create project |
| GET | `/projects/:id` | Member/Admin | Get project + its tasks |
| PUT | `/projects/:id` | **Admin** | Update project |
| DELETE | `/projects/:id` | **Admin** | Delete project + its tasks |
| POST | `/projects/:id/members` | **Admin** | Add member by email |
| DELETE | `/projects/:id/members/:userId` | **Admin** | Remove member |

### Tasks

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/tasks` | Authenticated | List tasks (supports `?project=`, `?status=`, `?overdue=true` filters) |
| GET | `/tasks/dashboard/stats` | Authenticated | Dashboard aggregations |
| POST | `/tasks` | Admin/Owner | Create task |
| GET | `/tasks/:id` | Project Member | Get task |
| PUT | `/tasks/:id` | Admin/Owner/Assignee* | Update task |
| DELETE | `/tasks/:id` | Admin/Owner | Delete task |

\* Assignees (Members) can only update the `status` of tasks assigned to them.

### Users

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/users` | Authenticated | List all users (for member selection) |

---

## 🔒 Role Permissions

| Capability | Admin | Member |
|---|:---:|:---:|
| View all projects | ✅ | ❌ (only their own/joined) |
| Create projects | ✅ | ❌ |
| Edit/delete projects | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks in own projects | ✅ | ✅ (if project owner) |
| Edit any task field | ✅ | ❌ |
| Change status of own assigned tasks | ✅ | ✅ |
| Delete tasks | ✅ | Project owner only |

---

## 🧪 Quick Test Walkthrough

1. **Sign up** as `admin@test.com` (role: Admin) and `member@test.com` (role: Member) — two browser windows.
2. As **Admin**, create a project (e.g. "Website Redesign").
3. Add the Member by their email under the project's Team panel.
4. Create a few tasks and assign some to the Member.
5. Log in as the **Member** — they only see the project they're in. They can change the status of their assigned tasks but can't delete or edit titles.
6. Check the **Dashboard** for live stats: total tasks, status breakdown, overdue tasks.

---

## 📦 Submission Checklist

- ✅ Authentication (Signup / Login) with JWT
- ✅ Project & Team Management
- ✅ Task creation, assignment & status tracking
- ✅ Dashboard with tasks / status / overdue
- ✅ REST APIs + MongoDB
- ✅ Validations (express-validator) & relationships (Mongoose refs)
- ✅ Role-Based Access Control (Admin / Member)
- ✅ Deployed on Railway
- ✅ Live URL
- ✅ GitHub repo
- ✅ README (this file)
- ⬜ 2–5 min demo video (record screen walkthrough)

---

## 📝 License

MIT — feel free to use this as a starting point.

---

**Built by Shubham**
