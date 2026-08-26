# Warehouse Inventory Management System

A modern, enterprise-grade multi-warehouse inventory management platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Public Website
- Premium landing page with Linear/Stripe/Vercel aesthetic
- Fully responsive design with custom typography and spacing
- Smooth animations and transitions
- Clear navigation to authentication pages

### Authentication
- Email/password registration with email verification
- Secure login with session management
- Password reset and forgot password flow
- Logout functionality
- Cookie-based sessions using Supabase SSR helpers
- Role-based access control (Admin, Manager, Staff)

### Dashboard
- Clean, modern dashboard layout with sidebar navigation
- Profile management page (view/edit profile)
- Empty state layouts ready for future features
- Responsive mobile navigation

### Admin Panel
- Separate admin layout with role-based access control
- User management: view all users and change roles
- **Data Exports**: Excel and 1C XML with filtering
- **AI Analytics**: Gemini-powered insights and predictions

### Export System
- **Excel Export**: Multi-sheet workbooks with formatted data
  - Summary sheet + warehouse-specific sheets
  - Styled headers, frozen rows, proper number formatting
  - Color-coded status and stock levels
  - Filters: stock status, warehouse, category, product status
- **1C XML Export**: CommerceML 2.x format for 1C integration
  - Catalog file (Классификатор/Каталог)
  - Offers file (ПакетПредложений) with prices and stock
  - Stable UUIDs for incremental updates
  - UTF-8 encoding with proper XML escaping
  - Delivered as ZIP with both files

### AI Services (Gemini)
- **Sales Trend Analysis**: Top movers, slow movers, period comparison
- **Reorder Predictions**: Days-to-stockout, suggested quantities
- **Product Descriptions**: AI-generated descriptions and features
- Structured JSON output validated with Zod
- Retry with exponential backoff
- Safe fallbacks on API errors

### Security
- Row Level Security (RLS) enabled on all tables
- Server-side role enforcement via middleware
- Admin/Manager-only access to exports and AI endpoints
- Rate limiting on all export and AI endpoints
- Input validation using Zod
- Export audit logging
- Secure HTTP headers (CSP, X-Frame-Options, etc.)
- No stack traces or raw errors exposed to clients
- CSRF-safe form handling
- No hardcoded secrets

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: Google Gemini (Generative AI)
- **Export**: ExcelJS, Archiver (ZIP)
- **UI Components**: Lucide React (icons)
- **Validation**: Zod
- **Deployment**: Vercel (zero-config)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git (optional, for version control)

## 🔧 Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Set up Supabase database**

   In your Supabase project dashboard:
   - Go to the SQL Editor
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run the SQL

   This will:
   - Create the `profiles` table
   - Enable Row Level Security
   - Set up RLS policies
   - Create triggers for automatic profile creation

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment to Vercel

### Via Vercel Dashboard

1. **Push your code to GitHub** (or GitLab/Bitbucket)

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure environment variables**
   - Add all variables from `.env.local` to Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Deploy to production
vercel --prod
```

## 📁 Project Structure

```
warehouse-inventory-system/
├── app/
│   ├── admin/                 # Admin panel (role-restricted)
│   ├── auth/                  # Authentication pages
│   ├── dashboard/             # Main dashboard
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css
├── components/
│   ├── admin/                 # Admin components
│   └── dashboard/             # Dashboard components
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── design-system.ts
│   ├── rate-limit.ts
│   ├── types.ts
│   ├── utils.ts
│   └── validations.ts
├── supabase/
│   └── migrations/            # Database migrations
├── middleware.ts              # Next.js middleware
└── README.md
```

## 🔐 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only read/edit their own profile
- Only Admins can read all profiles or change roles
- Policies are enforced at the database level

### Server-Side Protection
- Middleware enforces authentication on protected routes
- Role checks happen server-side, never client-only
- Service role key is never exposed to the client

### Input Validation
- All forms use Zod schemas for validation
- Server-side validation on API routes
- Type-safe inputs and outputs

### HTTP Security
- Security headers configured (CSP, X-Frame-Options, etc.)
- HTTPS-only cookies in production
- CSRF protection via SameSite cookies

## 👥 User Roles

### Staff (Default)
- Access to dashboard
- Can view/edit own profile
- Limited permissions (future features)

### Manager
- All Staff permissions
- Additional management capabilities (future features)

### Admin
- Full system access
- User management: view all users and change roles
- Access to admin panel
- All future admin features

## 🧪 Testing Your Setup

1. **Register a new account**
   - Go to `/auth/register`
   - Create an account
   - Check your email for verification

2. **Verify default role**
   - Log in at `/auth/login`
   - Check that you can access `/dashboard`
   - Verify you cannot access `/admin` (Staff role by default)

3. **Grant admin access**
   - Go to your Supabase dashboard
   - Navigate to Table Editor → `profiles`
   - Find your user and change `role` to `Admin`

4. **Test admin panel**
   - Refresh your dashboard
   - You should now see "Admin Panel" in the sidebar
   - Click it to access `/admin`
   - Test changing another user's role

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes |
| `NEXT_PUBLIC_APP_URL` | Your application URL | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Optional* |

**Important**: Never commit `.env.local` to version control. The service role key must remain secret.

*AI features require a Gemini API key. Get one at [Google AI Studio](https://makersuite.google.com/app/apikey). Without it, AI endpoints will return 503.

## 🧪 Testing Your Setup

1. **Register a new account**
   - Go to `/auth/register`
   - Create an account
   - Check your email for verification

2. **Verify default role**
   - Log in at `/auth/login`
   - Check that you can access `/dashboard`
   - Verify you cannot access `/admin` (Staff role by default)

3. **Grant admin access**
   - Go to your Supabase dashboard
   - Navigate to Table Editor → `profiles`
   - Find your user and change `role` to `Admin`

4. **Test admin panel**
   - Refresh your dashboard
   - You should now see "Admin Panel" in the sidebar
   - Click it to access `/admin`
   - Test changing another user's role

5. **Test exports**
   - Navigate to `/admin/exports`
   - Try exporting to Excel with different filters
   - Try exporting to 1C XML
   - Check the downloaded files

6. **Test AI features (if configured)**
   - Navigate to `/admin/analytics`
   - Click "Analyze Trends"
   - Review AI-generated insights

## 🚧 Completed Features

The following features have been implemented:

- ✅ **Authentication**: Complete email/password system
- ✅ **User Management**: Admin panel with role management
- ✅ **Data Exports**: Excel and 1C XML with filtering
- ✅ **AI Analytics**: Gemini-powered insights and predictions
- ✅ **Database Schema**: Products, warehouses, stock, orders
- ✅ **Export Auditing**: All exports logged for compliance
- **Exports**: Data export and reporting system
- **Analytics**: Real-time dashboards and insights

---

**Built with Next.js and Supabase**
