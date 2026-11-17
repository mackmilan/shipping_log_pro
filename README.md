<p align="center">
  <a href="README.md"><b>🇺🇸 English</b></a> &nbsp;|&nbsp;
  <a href="README.pt-BR.md">🇧🇷 Português</a>
</p>

# 🚚 ShippingLog PRO - Truck Unloading & Dock Window Management System

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Vue 3](https://img.shields.io/badge/Vue_3-Composition_API-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Tested-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Zero_Config-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

**ShippingLog PRO** is a comprehensive, production-ready logistics web application designed to track and optimize truck unloading time slots, warehouse dock utilization, yard waiting queues, and transit delays. 

Built with **NestJS**, **TypeORM**, **SQLite**, **Vue 3**, **TypeScript**, and **Tailwind CSS**, it delivers a seamless real-time operational dashboard, dual list/kanban management views, and precise stage-by-stage chronometry with downtime justification auditing.

---

## 📋 Table of Contents

- [Overview & Key Features](#-overview--key-features)
- [System Architecture](#-system-architecture)
- [Operational Lifecycle & Time Tracking](#-operational-lifecycle--time-tracking)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Default Demo Credentials](#-default-demo-credentials)
- [Quick Start & Installation](#-quick-start--installation)
- [Automated CI Pipeline (`./ci`)](#-automated-ci-pipeline-ci)
- [Development & Manual Execution](#-development--manual-execution)
- [Testing Suites](#-testing-suites)
- [API Reference & Swagger Documentation](#-api-reference--swagger-documentation)
- [Technology Stack](#-technology-stack)

---

## ✨ Overview & Key Features

### 1. ⏱ Unloading Window Management (Time Slots)
- Define planned arrival and departure windows (`scheduledStartTime`, `scheduledEndTime`).
- Link schedules to registered trucks, drivers, carrier companies, and invoice numbers.
- Automated or manual dock allocation.
- Dynamic adherence calculation: flags on-time arrivals or computes exact minutes of delay.

### 2. 🚛 Real-time Stage Progression & Stop Auditing
- Precise chronometry per stage (In Transit, Yard Wait, Docked, Unloading, etc.).
- Real-time idle/stopped state detection with visual high-priority alerts.
- Mandatory reason/justification logging for downtime events (e.g., highway traffic, tire blowout, customs/document inspection, mandatory driver rest).
- Chronological timeline audit trail recording the timestamp, duration in minutes, and the authenticated operator who confirmed each transition.

### 3. 📊 Operational Real-Time Dashboard
- **Active Operational Counters**: Real-time count of vehicles *In Transit*, *Stopped on the Road*, *In Yard Queue*, and *Currently Unloading*.
- **Key Performance Indicators (KPIs)**: Average stopped duration, average unloading time, average yard wait, and adherence rate.
- **Dock Status Grid**: Live visual monitoring of each bay (`AVAILABLE`, `OCCUPIED` with active load identifier, or `MAINTENANCE`).
- **Critical Alerts Feed**: Immediate highlighting of overdue arrivals or halted vehicles exceeding threshold limits.

### 4. 🗂 Dual Interface: Table List & Kanban Board
- **List View**: Dense operational table detailing carrier, plate, assigned dock, planned window, and accumulated stage times.
- **Kanban Board**: Drag-free, status-driven column view segmented by lifecycle stages for control tower monitoring.

### 5. 🏢 Local RBAC & Authentication
- Secure JWT-based local authentication with password hashing via **Bcrypt**.
- Role-based route guards in both backend APIs and Vue Router navigation.
- Zero external third-party authentication dependencies required.

### 6. 🌐 Internationalization (i18n) & Language Switcher
- Full bilingual support: **International English (`en`)** and **Brazilian Portuguese (`pt-BR`)**.
- Seamless translations across all 6 views (Login, Dashboard, Schedules, Docks, Trucks, Users), modals, forms, tables, timeline chronometry, and status/priority badges.
- Dynamic runtime language selector available in the navigation bar and on the login page (toggle between 🇧🇷 PT-BR and 🌐 EN).
- Automatic persistence of language preference in `localStorage` (`shipping_log_locale`).
- High-performance, zero-external-dependency reactive architecture built natively on Vue 3 Composition API with full TypeScript parity checking.

---

## 🏗 System Architecture

The project is structured as a cohesive monorepo utilizing npm workspaces:

```
shipping_log_pro/
├── backend/                  # NestJS REST API + TypeORM + SQLite
│   ├── src/
│   │   ├── common/           # Enums (Roles, Stages, Docks), Guards, and Decorators
│   │   ├── entities/         # TypeORM Entities (User, Truck, Dock, Schedule, StageLog)
│   │   ├── modules/
│   │   │   ├── auth/         # Local JWT + Bcrypt authentication & profile endpoints
│   │   │   ├── users/        # User CRUD & role administration (Admin only)
│   │   │   ├── docks/        # Warehouse dock management and occupancy states
│   │   │   ├── trucks/       # Fleet, driver, and carrier registry
│   │   │   ├── schedules/    # Time slot windows, chronometry calculations & KPIs
│   │   │   └── seed/         # Automatic demo dataset initialization on first boot
│   │   ├── app.module.ts
│   │   └── main.ts           # Swagger OpenAPI config and global validation pipes
│   └── database.sqlite       # Embedded zero-config SQLite database file
│
├── frontend/                 # Single Page Application (Vue 3 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Status badges, navigation layout, stage transition modals, LanguageSelector
│   │   ├── i18n/             # Reactive i18n engine and typed dictionaries (pt-BR, en)
│   │   ├── router/           # Vue Router with navigation guards per role
│   │   ├── services/         # Axios HTTP client with JWT interceptors
│   │   ├── stores/           # Pinia reactive state stores (auth, schedules, docks, trucks)
│   │   ├── types/            # TypeScript interfaces, DTOs, and enum contracts
│   │   └── views/            # Dashboard, Schedules (List & Kanban), Docks, Trucks, Users
│   └── vite.config.ts        # Vite configuration & proxy definitions
│
├── e2e/                      # Playwright End-to-End browser test suite
│   ├── auth-and-navigation.spec.ts
│   ├── i18n-language-switch.spec.ts
│   ├── schedules-workflow.spec.ts
│   └── users-management.spec.ts
│
├── ci                        # Executable unified CI & test automation script
├── playwright.config.ts      # Multi-browser Playwright configuration
└── package.json              # Monorepo root scripts orchestrating workspace commands
```

---

## ⏱ Operational Lifecycle & Time Tracking

Each truck schedule traverses an audited lifecycle state machine:

| Stage Code | Display Name | Description & Automatic Triggers |
|---|---|---|
| `SCHEDULED` | **Scheduled** | Trip created during logistics planning; window reserved. |
| `IN_TRANSIT` | **In Transit** | Truck departed origin and is traveling towards the distribution center. |
| `STOPPED` | **Stopped** | Truck halted en route (traffic jam, mechanical issue, inspection). **Triggers visual alarm and idle stopwatch.** Requires justification. |
| `WAITING_YARD` | **Waiting in Yard** | Truck arrived at the facility entrance/gate, awaiting dock assignment or clearance. |
| `AT_DOCK` | **At Dock** | Truck reversed into the assigned unloading bay. |
| `UNLOADING` | **Unloading** | Active cargo unloading in progress. **Automatically switches dock status to `OCCUPIED`.** |
| `COMPLETED` | **Completed** | Cargo unloaded, inspected, and signed off. **Automatically releases dock status back to `AVAILABLE`.** |
| `CANCELLED` | **Cancelled** | Appointment voided or cancelled by logistics coordination. |

---

## 🔒 Role-Based Access Control (RBAC)

The application enforces a granular 3-tier Role-Based Access Control system:

| Role | Target Persona | Scope of Permissions |
|---|---|---|
| **`ADMIN`** | Operations Director / Systems Admin | **Unrestricted Access:** Create/edit/delete users, manage docks and fleets, delete records, modify system configurations, and manage schedules. |
| **`OPERATOR`** | Yard Supervisor / Gate Controller / Dock Master | **Operational Management:** Create schedules, advance or alter truck stages, submit downtime stop reasons, allocate docks, and register new trucks/drivers. |
| **`USER`** | Read-Only Analyst / Logistics Viewer | **Read-Only Mode:** Access the dashboard, browse schedule lists and Kanban board, review timeline chronometry, and view dock occupancy. All edit/advance action buttons are disabled. |

---

## 🔑 Default Demo Credentials

On initial application startup, the backend automatically seeds a demo environment populated with docks, trucks, historical trips, and three default accounts:

| Role | E-mail | Password | Permissions Summary |
|---|---|---|---|
| **Administrator** | `admin@shippinglog.local` | `admin123` | Full access, user management & deletion rights |
| **Operator** | `operador@shippinglog.local` | `operador123` | Operational flow, stage updates & stop reasons |
| **User (Viewer)** | `usuario@shippinglog.local` | `user123` | Read-only consultation mode |

> 💡 **Quick Demo Login:** On the login screen, convenient **"Quick Demo Access"** buttons allow you to authenticate with any role in one click without typing credentials.

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` (LTS recommended)
- **npm**: `v9.x` or higher

### Installation

Clone the repository and install all dependencies across the monorepo:

```bash
git clone https://github.com/your-username/shipping_log_pro.git
cd shipping_log_pro

# Install dependencies for root, backend, and frontend
npm run install:all
```

---

## 🤖 Automated CI Pipeline (`./ci`)

A fully automated, self-contained CI pipeline script is included in the project root (`./ci`). It validates the environment, builds both packages, and executes unit, integration, and E2E test suites with rich reporting:

```bash
# Run the complete CI pipeline (Environment check + Builds + Backend & Frontend Tests + E2E Tests)
./ci
# Or via npm
npm run ci
```

### CLI Options for `./ci`:

| Command / Flag | Equivalent npm Script | Action |
|---|---|---|
| `./ci` | `npm run ci` | Full end-to-end CI pipeline run |
| `./ci --ui` / `-u` | `npm run test:e2e:ui` | Opens the **Playwright Interactive UI Mode** with live execution and time-travel debugger |
| `./ci --report` / `-r` | `npm run test:e2e:report` | Opens the generated **Playwright HTML Test Report** in your default web browser |
| `./ci --setup-only` | `npm run setup` | Performs dependency verification and builds both backend and frontend without running tests |
| `./ci --no-e2e` | — | Runs setup and unit/component test suites (Jest + Vitest), skipping Playwright browser tests |
| `./ci --help` / `-h` | — | Displays the command-line help interface |

---

## 💻 Development & Manual Execution

You can run both services concurrently or individually in separate terminals:

### Option A: Run Both Services Concurrently
```bash
npm run dev
```

### Option B: Run in Separate Terminals

**Terminal 1 — Backend API (Port 3000):**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend SPA (Port 5173):**
```bash
npm run dev:frontend
```

### Access URLs:
- 🌐 **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend REST API**: [http://localhost:3000/api](http://localhost:3000/api)
- 📖 **Interactive Swagger / OpenAPI Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## 🧪 Testing Suites

ShippingLog PRO includes comprehensive automated test coverage spanning unit, service, component, and full browser end-to-end validation.

```bash
# Run all tests (Backend unit + Frontend unit + Playwright E2E)
npm test

# Backend Tests (Jest)
npm run test:backend          # Execute backend unit & service tests
npm run test:backend:cov      # Execute backend tests with coverage report

# Frontend Tests (Vitest)
npm run test:frontend         # Execute Vue component & Pinia store tests
npm run test:frontend:cov     # Execute frontend tests with v8 coverage

# End-to-End Tests (Playwright)
npm run test:e2e              # Headless Playwright browser test execution
npm run test:e2e:ui           # Launch Playwright interactive visual UI mode
npm run test:e2e:report       # Serve visual HTML report with execution traces
```

---

## 📚 API Reference & Swagger Documentation

The backend exposes an interactive **OpenAPI / Swagger 3.0** documentation interface. When the backend is running, navigate to:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Key Endpoint Highlights

#### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate using email and password; returns JWT access token.
- `POST /api/auth/register` — Create a new user account.
- `GET /api/auth/me` — Fetch currently authenticated user profile and permissions (Bearer Token required).

#### Schedules & Time Windows (`/api/schedules`)
- `GET /api/schedules` — List schedules with filtering (by date, stage, dock, truck) and computed metrics.
- `GET /api/schedules/metrics` — Aggregate operational KPIs (average stopped duration, unloading time, active counts).
- `GET /api/schedules/:id` — Detailed schedule view including chronological stage transition history (`stageLogs`).
- `POST /api/schedules` — Book a new unloading window (`ADMIN` or `OPERATOR`).
- `POST /api/schedules/:id/stage` — Advance/update truck stage, close previous stage duration, and log stop justifications (`ADMIN` or `OPERATOR`).
- `DELETE /api/schedules/:id` — Delete a schedule (`ADMIN` only).

#### Docks (`/api/docks`)
- `GET /api/docks` — List all unloading docks with current statuses (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`) and types (`DRY`, `REFRIGERATED`, `BULK`, `HAZARDOUS`).
- `POST /api/docks` — Register a new dock (`ADMIN` or `OPERATOR`).
- `PUT /api/docks/:id` — Update dock information and operational availability.
- `DELETE /api/docks/:id` — Remove a dock (`ADMIN` only).

#### Trucks & Carriers (`/api/trucks`)
- `GET /api/trucks` — Retrieve list of registered trucks, drivers, and transport carriers.
- `POST /api/trucks` — Add a new truck to the fleet (`ADMIN` or `OPERATOR`).
- `PUT /api/trucks/:id` — Update truck/driver data.
- `DELETE /api/trucks/:id` — Remove a vehicle (`ADMIN` only).

#### Users Management (`/api/users`)
- `GET /api/users` — List system users (`ADMIN` only).
- `POST /api/users` — Create user with explicit role assignment (`ADMIN` only).
- `PUT /api/users/:id` — Edit user details or toggle active status (`ADMIN` only).
- `DELETE /api/users/:id` — Delete user account (`ADMIN` only).

---

## 🛠 Technology Stack

### Backend
- **Framework**: [NestJS 10](https://nestjs.com/) (Modular Architecture)
- **Database ORM**: [TypeORM 0.3](https://typeorm.io/)
- **Database**: [SQLite 3](https://www.sqlite.org/) (Embedded, zero external daemon setup)
- **Authentication**: Passport.js + `@nestjs/jwt` + `bcryptjs`
- **Validation**: `class-validator` + `class-transformer`
- **API Documentation**: `@nestjs/swagger` + `swagger-ui-express`
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router 4](https://router.vuejs.org/) with RBAC guards
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Icons**: [Lucide Vue Next](https://lucide.dev/)
- **HTTP Client**: Axios with interceptors
- **Testing**: Vitest + Vue Test Utils

### End-to-End Testing & CI
- **E2E Framework**: [Playwright Test](https://playwright.dev/) (Multi-browser Chromium/Firefox/WebKit)
- **CI Pipeline**: Custom zero-dependency shell automation (`./ci`)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) (or proprietary as configured by the organization).
