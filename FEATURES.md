Based on my comprehensive review of the codebase, here is a detailed list of features for the **Mini Shopping Site** project.

### 🛍️ Core Shopping Features
*   **Product Catalog**: Browse a dynamic list of products with details like SKU, price, stock levels, and status (`ACTIVE`, `OUT_OF_STOCK`, `HIDDEN`).
*   **Persistent Shopping Cart**: Add, remove, and update quantities of items. The cart is saved to the database for logged-in users.
*   **Checkout System**: Seamless transition from cart to order, capturing shipping addresses and calculating total prices.
*   **Order History**: Users can view their past orders and current order statuses.

### 🔐 Authentication & Role-Based Access Control (RBAC)
The system implements a robust 4-tier role system:
*   **Multi-Role Support**: Different interfaces for `CUSTOMER`, `ADMIN`, `COURIER`, and `SERVICE_AGENT`.
*   **Hybrid Auth**: Supports both standard Email/Password authentication and **Google OAuth** integration.
*   **Session Management**: Secure session handling using JWT and database-backed session tracking.
*   **Staff Login**: A dedicated portal for staff members to access their respective dashboards.

### 🛠️ Administrative & Staff Dashboards
*   **Admin Dashboard**: Full CRUD (Create, Read, Update, Delete) management for products and oversight of all orders.
*   **Courier Dashboard**: Specialized interface for delivery staff to view assigned shipments and update delivery status (e.g., `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`).
*   **Service Agent Dashboard**: Support interface for managing customer inquiries and order issues.

### 📦 Logistics & Payments
*   **Shipment Tracking**: Integrated shipping model that tracks tracking numbers, estimated delivery times, and actual delivery timestamps.
*   **Flexible Payments**: Support for multiple payment methods including Credit/Debit cards, Bank Transfers, and Wallets, with status tracking (`PENDING`, `COMPLETED`, `FAILED`).
*   **Courier Assignment**: Ability to link specific couriers to shipments, including vehicle type tracking for logistics optimization.

### 👤 User Management
*   **Profile Customization**: Users can update their personal information and upload profile avatars.
*   **Account Linking**: Support for linking multiple OAuth providers to a single user account.

### 🏗️ Technical Highlights
*   **Monorepo Architecture**: Managed with **Turborepo** and **Bun** for high-performance development and builds.
*   **Modern Frontend**: Built with **React 19**, **Vite**, **Tailwind CSS 4**, and **Zustand** for state management.
*   **High-Performance Backend**: Powered by **Elysia.js** (optimized for Bun) and **Prisma ORM** with **PostgreSQL**.
*   **Quality Assurance**: Comprehensive testing suite using **Vitest** for the frontend and **Bun test** for backend routes and database logic.
*   **Containerized Environment**: Includes a `docker-compose.yml` for easy database and environment orchestration.