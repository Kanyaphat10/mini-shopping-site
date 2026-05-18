# 🛍️ Mini Shopping Site

A modern full-stack mini e-commerce application built with modern web technologies.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| Backend | Elysia.js (Bun runtime) |
| Database | PostgreSQL (Docker) |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |

---

## 📁 Project Structure

```bash
mini-shopping-site/
├── apps/
│   ├── frontend/          # Vite React + TypeScript
│   │   ├── src/
│   │   ├── .env
│   │   └── package.json
│   │
│   └── backend/           # Elysia.js API
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── src/
│       ├── .env
│       └── package.json
│
└── docker-compose.yml
```

---

## ⚙️ Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) + Docker Compose

> ⚠️ Backend uses Bun runtime while frontend uses Node.js/npm.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd mini-shopping-site
```

---

### 2. Set up environment variables

### Backend — create `apps/backend/.env`

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/mini-shop"
```

### Frontend — create `apps/frontend/.env`

```env
VITE_API_URL=http://localhost:3001
```

> ⚠️ Make sure the credentials match your `docker-compose.yml`

---

### 3. Start the database

```bash
docker compose up -d

# Verify it's running
docker compose ps
```

---

### 4. Install dependencies

```bash
# Backend
cd apps/backend
bun install

# Frontend
cd ../frontend
npm install
```

---

### 5. Run database migrations

```bash
cd ../backend
bunx prisma migrate dev --name init
bunx prisma generate
```

---

### 6. Seed the database

```bash
bunx prisma db seed
```

This will create the following test accounts:

| Email | Password | Role |
|---|---|---|
| admin@example.com | admin123 | ADMIN |
| customer@example.com | customer123 | CUSTOMER |
| courier@example.com | courier123 | COURIER |
| agent@example.com | agent123 | SERVICE_AGENT |

---

### Reset the database (Development only)

```bash
bunx prisma migrate reset
```

This will:
- Reset the database
- Re-run all migrations
- Regenerate Prisma Client
- Re-seed the database

> ⚠️ All data will be deleted.

---

### 7. (Optional) Inspect the database

```bash
bunx prisma studio
```

---

## 🖥️ Running the App

Open **3 terminals**:

---

### Terminal 1 — Database

```bash
docker compose up -d
```

---

### Terminal 2 — Backend

```bash
cd apps/backend
bun dev
```

> API runs at `http://localhost:3001`

---

### Terminal 3 — Frontend

```bash
cd apps/frontend
npm run dev
```

> App runs at `http://localhost:5173`

---

### 🔐 Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/auth/session/validate` | Validate session |

---

### 📦 Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create product (ADMIN) |
| PUT | `/products/:id` | Update product (ADMIN) |
| DELETE | `/products/:id` | Delete product (ADMIN) |

---

### 🛒 Cart

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | Get current user's cart |
| POST | `/cart/items` | Add item to cart |
| DELETE | `/cart/items/:id` | Remove item from cart |

---

### 📋 Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders` | Get all orders |
| GET | `/orders/:id` | Get order by ID |
| POST | `/orders` | Create order |

---

## 👤 User Roles

| Role | Description |
|---|---|
| `ADMIN` | Manage products and view all orders |
| `CUSTOMER` | Browse products, manage cart, and place orders |
| `COURIER` | View and update shipment status |
| `SERVICE_AGENT` | Customer support access |

---

## ⚡ Useful Commands

### Backend Commands

```bash
cd apps/backend
```

Install dependencies

```bash
bun install
```

Run backend server

```bash
bun dev
```

Run migrations

```bash
bunx prisma migrate dev --name init
```

Generate Prisma Client

```bash
bunx prisma generate
```

Seed database

```bash
bunx prisma db seed
```

Open Prisma Studio

```bash
bunx prisma studio
```

Reset database

```bash
bunx prisma migrate reset
```

---

### Frontend Commands

```bash
cd apps/frontend
```

Install dependencies

```bash
npm install
```

Run frontend

```bash
npm run dev
```

---

### Docker Commands

Start containers

```bash
docker compose up -d
```

Stop containers

```bash
docker compose down
```

Check running containers

```bash
docker compose ps
```

View logs

```bash
docker compose logs
```