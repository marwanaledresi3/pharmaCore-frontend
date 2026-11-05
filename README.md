# PharmaCore Frontend

A modern pharmaceutical ERP and B2B marketplace frontend built with React and TypeScript. The application provides an integrated platform for managing pharmaceutical companies, inventory, purchasing, sales, accounting, financial transactions, and business-to-business operations.

## 🚀 Project Overview

PharmaCore is designed to provide pharmaceutical companies with a centralized system for managing their daily business operations through a responsive web application connected to a real backend API.

### Core Features

- **Authentication:** Secure login and user session management.
- **Dashboard:** Business overview and operational statistics.
- **Company Management:** Company information and settings.
- **Products Management:** Pharmaceutical product catalog and inventory.
- **Warehouses:** Warehouse and stock management.
- **Customers:** Customer records and account management.
- **Suppliers:** Supplier records and supplier management.
- **Purchase Orders:** Create, manage, and track purchase orders.
- **Incoming Purchase Orders:** Receive and process orders from connected companies.
- **Sales Orders:** Manage customer sales orders.
- **Invoices:** Generate and manage sales and purchase invoices.
- **Returns:** Process sales and purchase returns.
- **Payments:** Manage receipts, payments, and financial transactions.
- **Accounts:** Manage accounting records and account balances.
- **Journal Entries:** Manage accounting journal entries.
- **Expenses:** Record and track business expenses.
- **Currencies:** Manage currencies and exchange rates.
- **Reports:** Generate financial, inventory, sales, and purchasing reports.
- **B2B Marketplace:** Connect pharmaceutical companies and exchange business orders.
- **Notifications:** Receive system notifications.
- **PDF & Printing:** Generate printable invoices and business documents.
- **WebSocket:** Support real-time communication and updates.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend framework |
| TypeScript | Static typing |
| Vite | Development and build tooling |
| CSS | Application styling |
| REST API | Backend communication |
| WebSocket | Real-time communication |

## 📁 Project Structure

```text
frontend/
│
├── api/
│   ├── accountsApi.ts
│   ├── authApi.ts
│   ├── b2bApi.ts
│   ├── client.ts
│   ├── companyApi.ts
│   ├── customersApi.ts
│   ├── expensesApi.ts
│   ├── invoicesApi.ts
│   ├── notificationsApi.ts
│   ├── ordersApi.ts
│   ├── paymentsApi.ts
│   ├── pdfApi.ts
│   ├── pdfApi1.ts
│   ├── productsApi.ts
│   ├── reportsApi.ts
│   ├── returnsApi.ts
│   ├── suppliersApi.ts
│   ├── warehousesApi.ts
│   └── wsApi.ts
│
├── components/
│   ├── common/
│   ├── layout/
│   └── pdf/
│
├── context/
│   ├── AuthContext.tsx
│   ├── useWebSocket.ts
│   └── WebSocketContext.tsx
│
├── pages/
│   ├── AccountsPage.tsx
│   ├── B2BMarketplacePage.tsx
│   ├── CurrenciesPage.tsx
│   ├── CustomersPage.tsx
│   ├── DashboardPage.tsx
│   ├── DeliveryConfirmPage.tsx
│   ├── ExpensesPage.tsx
│   ├── IncomingPurchaseOrdersPage.tsx
│   ├── InvoicesPage.tsx
│   ├── JournalEntriesPage.tsx
│   ├── LoginPage.tsx
│   ├── PaymentsPage.tsx
│   ├── ProductsPage.tsx
│   ├── PurchaseOrdersPage.tsx
│   ├── ReportsPage.tsx
│   ├── ReturnsPage.tsx
│   ├── SalesOrdersPage.tsx
│   ├── SettingsPage.tsx
│   ├── SuppliersPage.tsx
│   ├── UsersPage.tsx
│   ├── WarehousesPage.tsx
│   │
│   ├── purchaseOrders/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── PurchaseOrdersPage.tsx
│   │
│   └── reports/
│       ├── components/
│       ├── constants.ts
│       ├── types.ts
│       ├── unwrap.ts
│       ├── utils.ts
│       └── ReportsPage.tsx
│
├── types/
│   └── index.ts
│
├── utils/
│   └── downloadInvoicePdf.tsx
│
├── App.tsx
├── main.tsx
├── index.css
└── README.md
```

## ⚙️ Requirements

Before running the project, make sure you have installed:

- Node.js (LTS recommended).
- npm.
- Git.
- A running PharmaCore backend API.
- Access to the configured database through the backend.

## 📥 Installation

Clone the repository:

```bash
git clone YOUR_FRONTEND_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

## 🔧 Environment Configuration

Create a `.env` file in the frontend root directory.

Configure the backend API URL:

```env
VITE_API_URL=https://pharnmacore-backend.onrender.com/api/v1
```

If your backend uses a different URL, update this variable accordingly.

**Important:** Never store database credentials, secret keys, or private backend credentials in frontend environment variables.

## ▶️ Run the Application

Start the development server:

```bash
npm run dev
```

Build the production application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🔗 Backend Integration

The frontend communicates with the PharmaCore backend using REST API endpoints.

Backend base URL:

```text
https://pharnmacore-backend.onrender.com
```

API base path:

```text
/api/v1
```

The API integration is organized into separate service files inside the `api/` directory.

Examples:

- `authApi.ts` — Authentication.
- `productsApi.ts` — Products and inventory.
- `customersApi.ts` — Customers.
- `suppliersApi.ts` — Suppliers.
- `ordersApi.ts` — Orders.
- `paymentsApi.ts` — Payments.
- `reportsApi.ts` — Reports.
- `b2bApi.ts` — B2B marketplace operations.

## 🔐 Authentication & Security

- Users must authenticate before accessing protected application pages.
- Authentication state is managed through `AuthContext.tsx`.
- API requests should use the configured authentication mechanism.
- Protected operations must be authorized by the backend.
- Company-specific data must be isolated according to the authenticated user's company permissions.

## 📄 PDF & Printing

The application supports PDF generation and printing for business documents, including:

- Sales invoices.
- Purchase invoices.
- Purchase orders.
- Sales orders.
- Returns.
- Payment vouchers.
- Receipt vouchers.
- Account statements.
- Financial and inventory reports.

Generated documents should use actual backend data and accurate transaction details.

## 🏗️ Development Guidelines

To maintain code quality and make future development easier:

1. Keep API operations separated into dedicated service files.
2. Keep each screen's business logic organized and reusable.
3. Use TypeScript types for API responses and application data.
4. Use real backend data instead of hardcoded demonstration data.
5. Avoid duplicating components and business logic.
6. Handle loading, validation, and API errors consistently.
7. Protect all private routes and sensitive operations.
8. Preserve existing database records and backend functionality.
9. Keep PDF generation and printing logic organized.
10. Test API integration before deploying changes.

## 🚀 Deployment

The frontend can be deployed to services such as:

- Vercel.
- Netlify.
- Any static hosting provider supporting Vite applications.

Configure the production API URL in the deployment environment variables.

## 📌 Project Status

**Project:** PharmaCore ERP & B2B Marketplace

**Frontend:** React + TypeScript

**Backend:** Node.js REST API

**Database:** PostgreSQL (Neon)

**Development Status:** Active Development & Testing

---

## 📜 License

All rights reserved.

PharmaCore is a proprietary software project. Unauthorized copying, redistribution, or commercial use is not permitted without permission from the project owner.