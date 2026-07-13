# Bazar Hisab - Backend API

<div align="center">
  
  ![Bazar Hisab Banner](https://img.shields.io/badge/Bazar_Hisab-Shared_Expense_Tracker-4f46e5?style=for-the-badge&logo=dependabot)
  
  [![Node Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![Typescript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8.x-47a248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
  [![Build Status](https://img.shields.io/badge/Build-Passing-22c55e?style=flat-square)](#)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE.md)
  
</div>

---

## 🌟 Overview

**Bazar Hisab** is a state-of-the-art backend REST API designed for shared household/roommate budgeting, grocery expense tracking, and utility billing calculations. It enables groups of users (e.g. partners, families, flatmates) to log daily grocery expenditures, track monthly bill payments (like house rent, wifi, electricity, travel), analyze price trend fluctuations, and moderate community testimonials.

---

## 🛠️ Tech Stack

- **Core Runtime**: Node.js & Express
- **Language**: TypeScript (Type-safe compilation)
- **Database**: MongoDB (Mongoose Object Modeling)
- **Security**: JSON Web Token (JWT) Authentication & Bcrypt hashing
- **Mail Service**: SMTP Nodemailer integrations with premium responsive HTML templates
- **Code Quality**: Prettier, ESLint, and strict Type configurations

---

## 🚀 Key Features

### 👥 Partner & Group Management
- **Group Shared Ledgers**: Link accounts (e.g., husband and wife) using unique auto-generated invite codes to calculate calculations collectively.
- **Strict Group Bounds**: Automatically prevents groups from exceeding a maximum limit of **20 active members**.
- **User Roles**: Secured authorization checks enforcing Admin, Moderator, and Standard User roles.

### 🍎 Product & Daily Bazar Tracking
- **Global Shared Products**: Unified database of products (e.g. eggs, rice) to avoid duplicate variations and spelling mismatches.
- **Unit Standardizations**: Converts gram (`GM`) purchases to kilogram (`KG`) values automatically (scaling price per unit by 1000) for consistent reporting.

### 💵 Comprehensive Bill / Expense Module
- Log utility rents, transit fares, wifi bills, electricity, maid salaries, building maintenance, shopping, grooming, and laundry.
- Automated pagination and total calculations integrated directly.

### 📊 Rich Analytics & Graph Endpoints
- **Dual-Mode Trend Data**: Day-by-day stats for the current month (`view=monthly`) and month-by-month stats for the current year (`view=yearly`).
- **Product Price Growth Milestones**: Plots historical unit price trends for any product with **duplicate-price compression** (only plotting actual changes and latest buy values) to feed clean line charts.

### 🛡️ Moderation & Audit Logging
- Background activity tracking logs creations, updates, deletions, and mergers across all models.
- Entire Audit log protected with strict **ADMIN only** visibility filters.

### ✉️ Support & Testimonial Centers
- **Contact Submissions**: Public contact form. Admins can reply directly, triggering responsive email notifications.
- **Feedback & Reviews**: Star rating reviews that administrators can moderate to display public testimonies.

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── config/             # Config variables & environment parsers
│   ├── middlewares/        # Authentication, role validation, error handlers
│   ├── modules/            # Domain-driven features (Controller, Route, Service, Model)
│   │   ├── auth/           # Registration, login, profile, deactivation
│   │   ├── product/        # Global product catalog
│   │   ├── bazar-entry/    # Daily grocery entries
│   │   ├── bill/           # Utilities, rent, wifi, mobile bills
│   │   ├── group/          # Create, join, and manage household partners
│   │   ├── dashboard/      # Admin stats, monthly trends, price growth
│   │   ├── activity/       # Admin audit logs
│   │   ├── contact/        # Contact forms & replies
│   │   └── feedback/       # Star reviews & testimonials
│   └── routes/             # Unified route registry index
├── errors/                 # Global ApiError utilities
├── utils/                  # Nodemailer, email templates, response structures
└── server.ts               # Express bootstrapping & Mongoose connections
```

---

## 🛣️ API Endpoints Reference

### 🔐 Authentication (`/api/v1/auth`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Login to account (returns JWT token) |
| `POST` | `/auth/forgot-password` | Public | Send password reset OTP |
| `POST` | `/auth/verify-otp` | Public | Verify OTP code |
| `POST` | `/auth/reset-password` | Public | Reset password with verified OTP |
| `PATCH` | `/auth/update-profile` | Private | Update logged user info |
| `DELETE`| `/auth/deactivate` | Private | Soft-delete own account |

### 👥 Groups (`/api/v1/groups`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/groups` | Private | Create a new partner group |
| `POST` | `/groups/join` | Private | Join an existing group using invite code |
| `DELETE`| `/groups/leave` | Private | Leave current group |
| `GET` | `/groups/my-group` | Private | Get current group details & members list |

### 🍎 Products (`/api/v1/products`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/products` | Private | Create a global product catalog item |
| `GET` | `/products` | Private | Query products (supports pagination & search) |
| `PATCH` | `/products/:id` | Private | Update product details |
| `DELETE`| `/products/:id` | Private | Delete product |

### 🛒 Bazar Entries (`/api/v1/bazar-entries`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/bazar-entries` | Private | Log a daily grocery bazar purchase |
| `GET` | `/bazar-entries` | Private | Query bazar history (supports pagination & date filter) |
| `GET` | `/bazar-entries/:id` | Private | Fetch details of a specific entry |
| `PATCH` | `/bazar-entries/:id` | Private | Update bazar purchase details |
| `DELETE`| `/bazar-entries/:id` | Private | Delete bazar entry |

### 💳 Bills & Expenses (`/api/v1/bills`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/bills` | Private | Log a utility bill (rent, wifi, electricity, etc.) |
| `GET` | `/bills` | Private | Fetch bills feed (filters by category, date, page) |
| `GET` | `/bills/:id` | Private | View specific bill details |
| `PATCH` | `/bills/:id` | Private | Edit a bill record |
| `DELETE`| `/bills/:id` | Private | Delete a bill record |

### 📊 Dashboard & Trend Graphs (`/api/v1/dashboard`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/admin-stats` | **Admin** | System aggregates (users, groups, average costs) |
| `GET` | `/dashboard/user-stats` | Private | Current/previous month and year stats comparisons |
| `GET` | `/dashboard/monthly-trend` | Private | Monthly trend values (`view=yearly` / `view=monthly`) |
| `GET` | `/dashboard/product-price-growth/:productId` | Private | Chronological deduplicated unit price graph history |

### 🛡️ Admin Audit Logs (`/api/v1/activities`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/activities` | **Admin** | View system audit activity log (paginated) |
| `DELETE`| `/activities` | **Admin** | Clear all activity history |
| `DELETE`| `/activities/:id` | **Admin** | Delete a single log item |

### ✉️ Contact Submissions (`/api/v1/contacts`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/contacts` | Public | Submit message through site contact form |
| `GET` | `/contacts` | **Admin** | List all user contact messages (paginated) |
| `GET` | `/contacts/:id` | **Admin** | View message details |
| `PATCH` | `/contacts/:id/reply` | **Admin** | Dispatch reply email to user |
| `DELETE`| `/contacts/:id` | **Admin** | Delete support message |

### ⭐ Feedback & Reviews (`/api/v1/feedbacks`)
| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/feedbacks` | Private | Post a rating review comment |
| `GET` | `/feedbacks` | Public | Fetch approved testimonials list. Admins get all. |
| `PATCH` | `/feedbacks/:id/toggle-public` | **Admin** | Approve/hide testimonial on landing page |
| `DELETE`| `/feedbacks/:id` | Private | Delete feedback review |

---

## ⚙️ Installation & Running Locally

1. Clone the repository and navigate into it:
   ```bash
   cd bazarhisab-backend
   ```
2. Install the node dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables inside `.env` (refer to `.env.example`):
   ```ini
   PORT=5000
   DATABASE_URL=mongodb://localhost:27017/bazarhisab
   BCRYPT_SALT_ROUNDS=12
   JWT_ACCESS_SECRET=your_access_secret_key
   JWT_ACCESS_EXPIRE=30d
   JWT_REFRESH_SECRET=your_refresh_secret_key
   JWT_REFRESH_EXPIRE=365d
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   SMTP_SENDER=Bazar Hisab <no-reply@bazarhisab.com>
   CLIENT_URL=http://localhost:3000
   ```
4. Build the typescript compiler:
   ```bash
   npm run build
   ```
5. Spin up the local development hot-reload server:
   ```bash
   npm run dev
   ```

---

## 📝 License

Distributed under the MIT License. See [LICENSE.md](LICENSE.md) for more information.
