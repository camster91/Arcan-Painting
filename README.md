# Arcan Painting - Full-Stack Painting Business CRM

A modern full-stack web application for a painting business, combining a public marketing website with an admin CRM dashboard for managing leads, clients, estimates, contracts, invoices, projects, scheduling, and team management.

## ✨ Features

### Public Marketing Website
- **Landing Page** - Showcase services, process, and company value
- **Services Section** - Detailed descriptions of painting services offered
- **Process Section** - Step-by-step work process visualization
- **FAQ Section** - Frequently asked questions with answers
- **Contact Section** - Contact form and business information
- **About Section** - Company story and team introduction

### Admin CRM Dashboard
- **Lead Management** - Track and manage potential customers
- **Client Management** - Store client information and history
- **Estimate Builder** - Create and send professional estimates
- **Contract Management** - Generate and track contracts
- **Invoice Management** - Create, send, and track invoices
- **Project Tracking** - Monitor project progress and timelines
- **Scheduling System** - Calendar-based scheduling for teams
- **Team Management** - Manage team members and assignments

### Technical Features
- **Full-Stack Architecture** - React frontend with Hono server backend
- **Real-time Updates** - Live updates for CRM data
- **Secure Authentication** - Built-in user authentication and authorization
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Database Integration** - PostgreSQL database with Neon serverless
- **API-First Design** - RESTful API for all business operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database (Neon recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/camster91/Arcan-Painting.git
   cd Arcan-Painting
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and configure:
   ```env
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your_session_secret
   # Add other required variables
   ```

4. **Set up database**
   ```bash
   bun run db:setup
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:5173`

## 🛠️ Development Commands

```bash
bun run dev          # Start development server
bun run typecheck    # Run TypeScript type checking
bun test             # Run tests with Vitest
```

## 📁 Project Structure

```
src/
├── app/                    # Main application code (file-based routing)
│   ├── page.jsx           # Homepage (public marketing site)
│   ├── layout.jsx         # Root layout
│   ├── admin/             # Admin dashboard pages
│   │   ├── page.jsx       # Admin dashboard home
│   │   ├── leads/         # Lead management
│   │   ├── clients/       # Client management
│   │   ├── estimates/     # Estimate creation/management
│   │   ├── contracts/     # Contract management
│   │   ├── invoices/      # Invoice management
│   │   ├── projects/      # Project tracking
│   │   ├── scheduling/    # Calendar/scheduling
│   │   ├── team/          # Team management
│   │   └── settings/      # Admin settings
│   ├── account/           # User account pages
│   ├── api/               # API routes (Hono handlers)
│   └── thank-you/         # Thank you page
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   └── *.jsx             # Public site components (Header, Footer, etc.)
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
├── utils/                # Utility functions
└── __create/             # Framework utilities
```

## 🏗️ Tech Stack

- **Framework**: React Router 7 with Hono server
- **Language**: JavaScript (JSX) for pages/components, TypeScript for configs
- **Styling**: Tailwind CSS 3 + Chakra UI 2.8
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Database**: Neon (serverless PostgreSQL)
- **Authentication**: @auth/core with @hono/auth-js
- **Build Tool**: Vite
- **Testing**: Vitest with Testing Library
- **Package Manager**: Bun

## 📦 Deployment

### Option 1: Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Option 2: Self-Hosted
1. Build production bundle:
   ```bash
   bun run build
   ```
2. Deploy the `dist` folder to your hosting service
3. Set up PostgreSQL database
4. Configure environment variables

## 🧪 Testing

Run the test suite:
```bash
bun test             # Run all tests
bun test --watch     # Watch mode
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 📞 Support

For support, please contact the project maintainer.

---

**Built with modern web technologies for efficient painting business management**