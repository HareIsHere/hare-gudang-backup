# HARE Gudang

### Multi-Warehouse Inventory Management System

HARE Gudang is a web-based warehouse management system designed to manage inventory, warehouse operations, stock requests, and user access across multiple warehouses.

The project focuses on building a structured warehouse management workflow with authentication, role-based access control, multi-warehouse authorization, inventory management, and automated testing.

> **Project Status:** Active Development

---

## ✨ Features

### 🔐 Authentication & Authorization

* User authentication
* Role-based access control
* Admin and Super Admin access levels
* Protected application routes
* Warehouse-level access control

### 🏢 Multi-Warehouse Management

* Manage multiple warehouses
* Assign users to specific warehouses
* Restrict warehouse operations based on user access
* Support inventory operations across different warehouse locations

### 📦 Inventory Management

* View inventory
* Manage stock information
* Track inventory by warehouse
* Inventory request workflow

### 📝 Inventory Requests

* Create inventory requests
* View request status
* Manage inventory request workflows
* Authorization based on warehouse access

### ⚙️ Master Data

The system provides centralized management for core warehouse data, including:

* Worksites
* Projects
* Products
* Prices
* Warehouses

### 🛡️ Role-Based Access Control

The current authorization model includes:

| Role          | Access                                                    |
| ------------- | --------------------------------------------------------- |
| `super_admin` | Full system access                                        |
| `admin`       | Administrative and warehouse management features          |
| `user`        | User-level operational features based on warehouse access |

Role authorization is combined with warehouse assignment so that access is determined not only by **what a user can do**, but also **which warehouse they are allowed to operate on**.

---

## 🏗️ Architecture

The application follows a modern Laravel + Inertia architecture:

```text
┌─────────────────────────────┐
│          React 19           │
│       Frontend / UI         │
└──────────────┬──────────────┘
               │
               │ Inertia.js
               ▼
┌─────────────────────────────┐
│         Laravel 13          │
│                             │
│  ┌───────────────────────┐  │
│  │ Authentication        │  │
│  │ Authorization / RBAC  │  │
│  │ Controllers            │  │
│  │ Models / Eloquent      │  │
│  │ Validation             │  │
│  └───────────────────────┘  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Database           │
│                             │
│ Users                       │
│ Warehouses                  │
│ Inventory                   │
│ Requests                    │
│ Master Data                 │
└─────────────────────────────┘
```

---

## 🧰 Tech Stack

### Backend

* PHP 8.5
* Laravel 13
* Laravel Fortify
* Laravel Wayfinder
* Eloquent ORM

### Frontend

* React 19
* Inertia.js 3
* TypeScript
* Tailwind CSS 4
* Vite

### Development & Testing

* Pest PHP 4
* PHPUnit 12
* Laravel Pint
* Laravel Boost
* GitHub Actions

---

## 🔒 Authorization Model

HARE Gudang uses two complementary authorization concepts:

```text
                    User
                     │
              ┌──────┴──────┐
              │             │
             Role       Warehouse Access
              │             │
       ┌──────┼──────┐      │
       │      │      │      │
   Super    Admin   User    │
   Admin                   │
                            │
                 ┌──────────┴──────────┐
                 │                     │
             Warehouse A           Warehouse B
```

This separation allows the system to distinguish between:

* **Role authorization** — what actions a user can perform.
* **Warehouse authorization** — where those actions can be performed.

This is particularly important in a multi-warehouse environment where users may only have access to specific warehouse locations.

---

## 🧪 Testing

The project includes automated tests using **Pest PHP**.

The test suite covers application behavior such as:

* Authentication
* Role-based authorization
* Warehouse access
* Inventory operations
* Inventory requests
* Administrative operations
* Access restrictions between different user roles

Run the test suite with:

```bash
php artisan test
```

For a more compact output:

```bash
php artisan test --compact
```

---

## 🚀 Getting Started

### Requirements

Make sure the following are installed:

* PHP 8.3+
* Composer
* Node.js
* npm
* A supported database

### 1. Clone the repository

```bash
git clone https://github.com/HareIsHere/hare-gudang-backup.git
cd hare-gudang-backup
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

Configure your database credentials in `.env`.

### 4. Run migrations

```bash
php artisan migrate
```

### 5. Install frontend dependencies

```bash
npm install
```

### 6. Build frontend assets

```bash
npm run build
```

### 7. Start the application

For local development:

```bash
php artisan serve
```

And in another terminal:

```bash
npm run dev
```

---

## 💻 Development

The project provides development tooling through Composer scripts.

Run the development environment with:

```bash
composer run dev
```

Run linting:

```bash
composer run lint
```

Run the complete test workflow:

```bash
composer run test
```

---

## 📁 Project Structure

```text
app/
├── Http/
├── Models/
├── Providers/
└── ...

database/
├── factories/
├── migrations/
└── seeders/

resources/
└── js/
    ├── components/
    ├── layouts/
    └── pages/

routes/
├── auth.php
└── web.php

tests/
├── Feature/
└── Unit/

.github/
└── workflows/
```

---

## 🔄 CI / GitHub Actions

The repository includes GitHub Actions workflows for automated project checks.

The goal is to ensure that changes are validated before being considered ready for integration.

```text
Git Push
   │
   ▼
GitHub Actions
   │
   ├── Code Quality
   ├── Formatting / Linting
   ├── Type Checking
   └── Automated Tests
          │
          ▼
       Validation
```

---

## 🎯 Project Goals

The main goals of HARE Gudang are:

1. Centralize warehouse and inventory management.
2. Support multiple warehouse locations.
3. Provide controlled access based on user roles.
4. Restrict operations according to warehouse assignment.
5. Reduce manual inventory management workflows.
6. Provide a maintainable foundation for future warehouse features.

---

## 🛣️ Future Improvements

Potential future improvements include:

* More granular permission management
* Inventory transaction history
* Stock movement tracking
* Reporting and analytics
* Audit logging
* Improved notification workflows
* Production deployment
* Expanded automated test coverage

---

## 👨‍💻 Project

**HARE Gudang**

Built with Laravel, React, and Inertia.js.

Repository:

https://github.com/HareIsHere/hare-gudang-backup

---

## 📄 License

This project is currently maintained as a portfolio and development project.
