# FinLife - Personal Finance Management System

## Overview

FinLife is a personal finance management web application designed to help users track finances, manage transactions, set financial goals, and visualize their financial health. It supports full CRUD operations for transactions and goals, includes password recovery, internationalization, theme management, and a mobile-first responsive design. The project aims for a modular architecture to ensure scalability and maintainability, providing dashboards, real-time updates, and smart notification systems for financial events.

## Recent Changes

### December 2025

- **Goal Management Fixes (Dec 1)**:
  - Fixed goal filtering: Changed from `isCompleted`/`isArchived` to correct Firebase fields (`achieved`/`archived`)
  - Goals now properly separate into Active, Completed, and Archived tabs
  - Fixed automatic page refresh: Goals now reload from Firebase when adding contributions (previously used stale data)
  - Improved `formatExpectedDate` function to handle multiple timestamp formats (Firestore timestamps, milliseconds, ISO strings)

- **Celebration Modal Enhancement (Dec 1)**:
  - Enhanced CSS styling for goal completion modal with gradient backgrounds
  - Added sequential animations (fade-in, slide-up) for header, summary box, and action buttons
  - Improved button design with gradient fills and better hover effects
  - Added ripple effect on button click, icon scaling on hover
  - Better spacing and visual hierarchy with dark mode support
  - Responsive design for mobile (375px), tablet (768px), and desktop viewports

### November 2025

- **UI Reorganization (Nov 28)**: Separated concerns between Dashboard and Analytics pages
  - **Dashboard**: Simplified to 8 KPI summary cards only (Net Worth, Bank Accounts, Cash, Credit Card Debt, Income, Expenses, Goals Summary, Cash Flow) + quick action buttons
  - **Analytics**: Expanded with full transactions list (grouped by date), goals section with tabs (Active/Completed/Archived), and action buttons for adding transactions/goals
  - Code reduced: dashboard.js from 1407 lines to ~300 lines
- **Firebase Index Fallback**: Added resilient fallback in accounts-service.js that handles missing composite index by using simpler query + client-side filtering/sorting
- **Real-time Dashboard Sync**: Dashboard subscribes to accounts changes via Firestore onSnapshot, automatically updating balance cards
- **Simplified Account Form**: Removed "Last 4 Digits" and "Bank" fields, now only "Bank Name" (e.g., Nubank, Chase) is required
- **Accounts & Cards System**: Full multi-account management with balance tracking
  - Account types: Checking, Savings, Credit Card, Debit Card, Cash, Investment
  - CRUD operations with archive/unarchive support
  - Automatic balance calculation and recalculation
  - Transfer between accounts with dual-entry accounting
  - Credit card limit tracking with available balance display
  - Transactions linked to accounts with automatic balance updates
  - Consistency rules: validation for negative balances, different transfer accounts
- **Currency Conversion System**: Multi-currency support (EUR, USD, BRL, GBP) using Frankfurter API with real-time exchange rates
  - Transactions save original amount + converted amount + exchange rate + rate date
  - Real-time validation and conversion preview in transaction forms
  - Dashboard displays converted amounts with indicator for foreign currencies
  - Account balances stored in base currency for consistency
- **Activity Log Integration**: Adapted to use existing `log` Firebase collection with proper audit trail (action, before/after states, timestamps)
- **Settings Consolidation**: Removed standalone Settings page, all configuration now in Profile page Settings tab
- **Home Page Redesign**: New attractive landing page with hero section, quick access cards (Dashboard, Analytics, Profile), features grid, and CTA section
- **Analytics Page**: New /analytics route with Chart.js visualizations (monthly bar chart, category pie chart, spending trend line)
- **Recurring Transactions Panel**: New /recurring route to manage recurring income/expenses with summary stats
- **Navigation Updates**: Home hidden for logged-in users, Analytics, Accounts and Recurring links added for authenticated users

## User Preferences

Preferred communication style: Simple, everyday language. Portuguese (Brazil).

## Project Structure

```
finlife/
├── app.py                      # Flask main application and routes
├── auth.py                     # Authentication helpers
├── config.py                   # Environment configuration
├── firebase_service.py         # Firebase Admin SDK service
├── pyproject.toml              # Python dependencies (uv)
├── uv.lock                     # Dependency lock file
│
├── templates/                  # Jinja2 HTML templates
│   ├── index.html              # Base template with navbar, theme, i18n
│   ├── home.html               # Landing page (public)
│   ├── login.html              # Login page
│   ├── signup.html             # Registration page
│   ├── dashboard.html          # Main dashboard with transactions/goals
│   ├── accounts.html           # Accounts & Cards management
│   ├── analytics.html          # Charts and visualizations
│   ├── recurring.html          # Recurring transactions panel
│   └── profile.html            # User profile with settings tabs
│
├── static/
│   ├── favicon/
│   │   └── favicon.ico
│   ├── images/
│   │   └── avatar-default.png
│   ├── style/
│   │   ├── main.css            # Global styles, CSS variables, responsive
│   │   ├── modal.css           # Modal system styles
│   │   ├── profile.css         # Profile page specific styles
│   │   └── validators.css      # Form validation styles
│   └── js/
│       ├── app.js              # Main app initialization
│       ├── i18n.js             # Internationalization (EN/PT)
│       ├── theme.js            # Light/dark theme toggle
│       ├── sync.js             # Real-time sync utilities
│       ├── expenses.js         # Transaction CRUD operations
│       ├── goals.js            # Goals CRUD and contributions
│       │
│       ├── firebase/           # Firebase configuration and utilities
│       │   ├── firebase-config.js    # Firebase app initialization
│       │   ├── firebase-dbs.js       # Collection names constants
│       │   ├── firestore-service.js  # Firestore CRUD helpers
│       │   └── firestore-utils.js    # Query utilities
│       │
│       ├── pages/              # Page-specific modules
│       │   ├── dashboard.js    # Dashboard logic with real-time accounts sync
│       │   ├── accounts.js     # Accounts page with CRUD modals
│       │   ├── analytics.js    # Chart.js visualizations
│       │   ├── recurring.js    # Recurring transactions management
│       │   ├── profile.js      # Profile and settings tabs
│       │   └── auth.js         # Login/signup logic
│       │
│       ├── services/           # Business logic services
│       │   ├── accounts-service.js   # Accounts CRUD, transfers, balance calc
│       │   ├── currency-service.js   # Frankfurter API, exchange rates
│       │   ├── activity-log.js       # Audit trail logging
│       │   ├── profile-service.js    # Profile updates, avatar upload
│       │   └── user-preferences.js   # User settings management
│       │
│       └── utils/              # Utility modules
│           ├── modal.js        # Modal system with sub-modals
│           ├── alerts.js       # Toast notifications
│           ├── projections.js  # Goal projection calculations
│           ├── goal-normalizer.js       # Goal data normalization
│           ├── goal-notifications.js    # Goal due date alerts
│           ├── goal-completion-modal.js # Celebration modal
│           ├── expense-notifications.js # Expense alerts
│           └── recurring-transactions.js # Recurring logic
│
├── docs/                       # Documentation
│   └── EMAIL_NOTIFICATIONS.md
│
└── attached_assets/            # User attachments and references
```

## System Architecture

### Frontend Architecture

**Template System**: Flask's Jinja2 engine with a base template for consistent UI.
**CSS Organization**: Modular CSS with a mobile-first approach and CSS Grid.
**JavaScript Module Pattern**: ES6 modules for client-side logic, including Firebase integration, internationalization, and theme management.
**Internationalization System**: `data-i18n` attributes for EN/PT translations, language preference stored in localStorage.
**Real-time Synchronization**: 
- Custom event-driven architecture
- Firebase Firestore `onSnapshot` listeners for UI updates
- Dashboard subscribes to accounts collection for real-time balance updates

**UI/UX Patterns**:
- **Theme System**: Light/dark theme toggle using CSS custom properties and localStorage.
- **Dashboard Components**: Two rows of cards - first row for account balances (Net Worth, Bank, Cash, Credit Debt), second row for period metrics (Income, Expenses, Goals, Cash Flow)
- **Notifications**: Goal due date notifications and expense alerts
- **Avatar Upload**: Cropper.js integration for image cropping and upload to Firebase Storage
- **Modal System**: Instance-based for scope isolation, supporting sub-modals, dynamic z-index, and blur management
- **Smart Transaction Filtering**: Filters by period with timezone-safe date parsing, advanced filtering by type, category, and recurring status

### Backend Architecture

**Web Framework**: Flask handles routing, template rendering, and static file serving.
**Environment Configuration**: `.env` files and `python-dotenv` for secure configuration.
**Design Pattern**: MVC-like pattern with Flask as Controller, Jinja2 as View, and Firebase as Model.
**Authentication & Authorization**: Firebase Authentication for client-side, Flask verifies JWT tokens with Firebase Admin SDK for server-side sessions.

### Data Management

**Firebase Firestore Collections**:
- `USERS` - User profiles and preferences
- `TRANSACTIONS` - Income/expense records with account linkage
- `GOALS` - Financial goals with contributions
- `ACCOUNTS` - Bank accounts, cards, cash (requires composite index: uid + createdAt)
- `LOGS` - Audit trail for all operations

**Key Features**:
- Transactions must be linked to an account (REQUIRE_ACCOUNT_FOR_TRANSACTION=true)
- Balance updates use real-time subscriptions
- Recurring transactions: Virtual occurrences generated dynamically in the UI

## External Dependencies

### Third-party Services

**Firebase (v11.0.1)**: Core, Authentication, Firestore, Storage
**Frankfurter API**: Real-time currency exchange rates

### Frontend Libraries

**Chart.js**: Data visualization for analytics
**Cropper.js**: Avatar image cropping

### Python Dependencies

**Flask**: Web framework
**python-dotenv**: Environment variable management
**Firebase Admin SDK**: Backend Firebase interactions
