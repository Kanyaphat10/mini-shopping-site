# 🛍️ Mini Shopping Site

A full-stack mini e-commerce application built with modern web technologies.

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

```
mini-shopping-site/
├── apps/
│   ├── frontend/          # Vite React + TypeScript
│   │   ├── src/
│   │   ├── .env
│   │   └── package.json
│   └── backend/           # Elysia.js API
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── src/
│       ├── .env
│       └── package.json
└── docker-compose.yml
```

---

## ⚙️ Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) + Docker Compose

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd mini-shopping-site
```

### 2. Set up environment variables

**Backend** — create `apps/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/mini-shop"
```

**Frontend** — create `apps/frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

> ⚠️ Make sure the credentials match your `docker-compose.yml`

### 3. Start the database

```bash
docker compose up -d

# Verify it's running
docker compose ps
```

### 4. Install dependencies

```bash
# Backend
cd apps/backend
bun install

# Frontend
cd ../frontend
npm install
```

### 5. Run database migrations

```bash
cd apps/backend
bunx prisma migrate dev --name init
```

### 6. Seed the database

```bash
bunx prisma db seed
```

This will create the following test accounts:

| Email | Role |
|---|---|
| admin@example.com | ADMIN |
| customer@example.com | CUSTOMER |
| courier@example.com | COURIER |
| agent@example.com | SERVICE_AGENT |

### 7. (Optional) Inspect the database

```bash
bunx prisma studio
```

Opens Prisma Studio at `http://localhost:5555`

---

## 🖥️ Running the App

Open **3 terminals**:

**Terminal 1 — Database**
```bash
docker compose up -d
```

**Terminal 2 — Backend**
```bash
cd apps/backend
bun dev
```
> API runs at `http://localhost:3001`

**Terminal 3 — Frontend**
```bash
cd apps/frontend
npm run dev
```
> App runs at `http://localhost:5173`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/session/validate` | Validate session |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products` | Create product (ADMIN) |
| PUT | `/api/products/:id` | Update product (ADMIN) |
| DELETE | `/api/products/:id` | Delete product (ADMIN) |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cart` | Get current user's cart |
| POST | `/api/cart/items` | Add item to cart |
| DELETE | `/api/cart/items/:id` | Remove item from cart |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get order by ID |
| POST | `/api/orders` | Create order |

---

## 👤 User Roles

| Role | Description |
|---|---|
| `ADMIN` | Manage products, view all orders |
| `CUSTOMER` | Browse products, manage cart, place orders |
| `COURIER` | View and update shipment status |
| `SERVICE_AGENT` | Customer support access |