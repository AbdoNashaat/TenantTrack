# TenantTrack (Supabase Edition)

## 📌 Overview
TenantTrack is a simple, mobile-friendly web application designed to manage the finances of an apartment block using **Supabase** for the database, authentication, and hosting. It tracks tenants, monthly fees, expenses, income, and provides transparent financial reporting.

---

## 🏠 Basic Needs

* **Finance Management**: Track and manage all financial aspects using a **PostgreSQL-backed relational database**.
* **Block Structure**: Hierarchical structure mapping apartments, floors, and tenants.
* **Tenant Details**: Structured profiles with standard fields and custom metadata.
* **Monthly Records**: Monthly partitioning of expenses and income records.
* **Dashboard**: Secure real-time UI showing payments and status.
* **Payment History**: Detailed audit trail of all transactions.
* **Expense Tracking**: Categorized standard (recurring) and non-standard (ad-hoc) expenses.
* **Maintenance Fund**: A dedicated bucket for long-term reserves, tracked via transaction ledgers.
* **Status Tracking**: Real-time calculated status (Green/Yellow/Red) via SQL views or database functions.

---

## ⚙️ Constraints

* **Mobile-Friendly Website**: Responsive design powered by modern frontend frameworks.
* **Supabase Hosting**: Deployed using **Supabase CLI** and **Vercel** (or Supabase's native edge-hosting capabilities).
* **Serverless Architecture**: Logic handled via **Supabase Edge Functions** (TypeScript), removing the need for a custom dedicated backend server.
* **Row-Level Security (RLS)**: Fine-grained access control ensuring tenants only view their own data, while Admins have full access.
* **User Accounts**: Managed via **Supabase Auth** (Email/Password or Magic Links), integrated with a `roles` table.
* **Data Export**: Use SQL-based queries to generate CSVs or utilize libraries like `SheetJS` on the client side.
* **CI/CD**: Streamlined deployment using GitHub Actions integrated with the Supabase project.
* **Minimal Dependencies**: Utilizing the native `supabase-js` client for all data interactions.
* **Transparency**: Financial records accessed via RLS-protected policies to ensure data integrity and trust.

---

## 🚀 Getting Started

1.  **Initialize Project**: Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2.  **Define Schema**: Run your SQL migration scripts to set up tables (Users, Tenants, Payments, etc.) and establish Foreign Key relationships.
3.  **Configure RLS**: Enable Row-Level Security on all tables to enforce data privacy (e.g., `CREATE POLICY "Tenants can only see their own records" ...`).
4.  **Connect Client**: Install the `@supabase/supabase-js` library and initialize the client with your Project URL and Anon Key.
5.  **Develop & Deploy**: Build your UI, connect via the JS client, and deploy to Vercel/Netlify for automatic CI/CD.

---

## 📊 Features Roadmap

* **Tenant Portal**: Secure login and dashboard.
* **Admin Console**: Full CRUD operations for expenses, tenants, and funds.
* **Reporting**: Automated data fetching for Excel/CSV exports.
* **Real-time Alerts**: Use Supabase Realtime to update status (Green/Yellow/Red) instantly when a payment is logged.

---

## 👥 Roles & Access

* **Admin**: Role assigned in a `profiles` table; has `ALL` permissions via RLS policies.
* **Tenant**: Authenticated users; RLS policies restrict their `SELECT` access to their `tenant_id` and public financial summaries.

---

## 📂 Data Transparency
Financial data is stored relationally, allowing for complex joins. **Row-Level Security** ensures that while the database is a single source of truth, user visibility is strictly controlled, maintaining trust within the community.

---