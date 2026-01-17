# Payment Gateway – Full Stack Assignment



## Overview

This project is a simplified **payment gateway system** inspired by providers like Razorpay and Stripe.

It demonstrates:

* Secure API-based merchant authentication
* Order and payment processing
* Persistent storage using PostgreSQL
* Merchant dashboard with real-time statistics
* Checkout flow for customers

The implementation strictly follows the assignment requirements and is fully Dockerized.

---

## Tech Stack

* **Backend:** Node.js, Express
* **Database:** PostgreSQL
* **Dashboard Frontend:** React
* **Checkout Frontend:** Vanilla HTML, CSS, JavaScript
* **Containerization:** Docker & Docker Compose

The dashboard is implemented using React for better state management and UX.

---

## Architecture

```
Dashboard (Port 3000) ──┐
                        ├── Backend API (Port 8000) ── PostgreSQL
Checkout (Port 3001) ───┘
```

* All data flows through the backend API
* PostgreSQL is the single source of truth
* No in-memory or mock storage is used

---

## Authentication Model

As required by the assignment:

* There is **no real user authentication**
* Merchant login is simulated
* API authentication is done using:

  * `X-Api-Key`
  * `X-Api-Secret`

### Test Merchant Credentials

```
API Key:    key_test_abc123
API Secret: secret_test_xyz789
```

---

## Dashboard Application (Port 3000)

### Features

* Merchant login (simulated)
* Displays:

  * API Key & API Secret
  * Total transactions
  * Total successful amount
  * Success rate
* Full transaction list
* All data is fetched from backend APIs

### Important Note

The dashboard does **not store any transaction data locally**.
All values are fetched dynamically from PostgreSQL via the backend.

---

## Checkout Application (Port 3001)

### Checkout Flow

1. Order is created using backend API
2. Checkout page is opened with `order_id`
3. Order details are fetched from backend
4. User selects payment method (UPI / Card)
5. Payment is processed
6. Payment status is polled and shown to the user

### Structure Requirement

The checkout page strictly follows the required HTML structure using `data-test-id` attributes, as specified in the assignment.

### Public Checkout APIs

The checkout page uses unauthenticated public endpoints:

GET  /checkout/orders/:order_id
POST /checkout/payments

---

## Backend API

### Health Check

```
GET /health
```

Returns backend and database status.

---

### Orders

```
POST /api/v1/orders
```

Creates a new order.

---

### Payments

```
POST /api/v1/payments
GET  /api/v1/payments/:id
```

Creates a payment and fetches its status.

---

### Dashboard APIs

```
GET /api/v1/dashboard/stats
GET /api/v1/dashboard/transactions
```

Returns aggregated statistics and transaction history.

All protected endpoints require:

* `X-Api-Key`
* `X-Api-Secret`

---

## Database

* **PostgreSQL** is used for persistence
* Tables:

  * `orders`
  * `payments`
* Dashboard statistics are calculated using SQL aggregation queries
* Database is initialized automatically on first run

### Expected Behavior

A fresh Docker run starts with an empty database.
Transactions appear only after orders and payments are created.

---

## Environment Variables

### `.env.example`

```env
# Server
PORT=8000

# Database
DATABASE_URL=postgresql://gateway_user:gateway_pass@postgres:5432/payment_gateway

# Test mode
TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
```

> `.env` is intentionally not committed.
> Create your own `.env` using `.env.example`.

---

## Docker Setup

### Build and Run

```bash
docker-compose up --build
```

### Stop

```bash
docker-compose down
```

---

Here’s the exact section you need to **copy–paste immediately after your “Docker Setup” section** in `README.md` — no other edits required:

```md
---

## Quick Start (Evaluator Friendly)

Follow these steps to run the entire system in a fresh environment:

```bash
git clone <your-repo-url>
cd payment-gateway
cp .env.example .env
docker-compose up --build
```

Once started, all services will be available at:

Backend API: http://localhost:8000

Merchant Dashboard: http://localhost:3000

Checkout Page: http://localhost:3001

No manual database setup or additional steps are required.

---
