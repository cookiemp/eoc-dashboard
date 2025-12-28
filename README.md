# ERCS Intel Dashboard

An AI-powered intelligence dashboard for the Ethiopian Red Cross Society (ERCS) Emergency Operations Center (EOC), providing real-time situational awareness through news analysis and field incident reporting.

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-purple)

##  Features

###  News Intelligence
- **Multi-source Aggregation**: Fetches humanitarian and general news from multiple Ethiopian sources
- **AI Categorization**: Automatically categorizes news as humanitarian or general using Gemini AI
- **Incident Extraction**: Extracts geographic incidents from humanitarian news articles
- **Daily AI Briefing**: Generates concise summaries of news and field reports
- **Health Alerts**: Automatically identifies and highlights public health emergencies

###  Interactive Incident Map
- **Real-time Visualization**: Displays incidents from news and field reports on an interactive map
- **Smart Markers**: Distinguishes between news-based incidents and field reports
- **Incident Details**: Click any marker to view AI-generated incident dossiers
- **Navigation**: Click "More" links in the AI summary to jump directly to incidents on the map

###  Field Incident Integration
- **KoBoToolbox Sync**: Automatically syncs field reports from IFRC KoBoToolbox every 30 minutes
- **AI Geocoding**: Converts Ethiopian administrative locations to GPS coordinates
- **Priority Display**: Field incidents appear first in the AI summary (as ground truth)
- **Admin Review**: Low-confidence geocoding flagged for manual verification

###  Admin Dashboard
- **Incident Management**: Review, approve, and manage field incidents
- **PDF Upload**: Extract incidents from PDF field reports
- **Crawler Health**: Monitor news source status
- **User Authentication**: Secure access control

##  Quick Start

### Prerequisites
- Node.js 18+
- Firebase project with Firestore
- Google AI API key (for Gemini)
- KoBoToolbox account (optional, for field reports)

### Installation

```bash
# Clone the repository
git clone https://github.com/cookiemp/eoc-dashboard.git
cd eoc-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Environment Variables

Create `.env.local` with the following:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google AI (Gemini)
GOOGLE_API_KEY=your-gemini-api-key

# KoBoToolbox (optional)
KOBO_SERVER=https://kobo.ifrc.org
KOBO_API_KEY=your-kobo-api-token
KOBO_ASSET_UID=your-form-asset-uid

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

##  Documentation

- **[KoBo Integration Guide](./KOBO_INTEGRATION.md)**: Complete guide for field report sync
- **Architecture**: Next.js 15 with App Router, Server Actions, and Genkit AI flows
- **Deployment**: Vercel (recommended) or any Node.js hosting platform

##  Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Manual KoBo sync
npm run sync:kobo
```

##  Project Structure

```
eoc-dashboard/
├── src/
│   ├── ai/flows/              # Genkit AI flows
│   │   ├── categorize-news-articles-flow.ts
│   │   ├── extract-incidents-from-news-flow.ts
│   │   ├── geocode-ethiopian-location-flow.ts
│   │   ├── generate-incident-dossier-flow.ts
│   │   └── summarize-incident-data.ts
│   ├── app/                   # Next.js app pages
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── api/              # API routes
│   │   ├── actions.ts        # Server actions
│   │   └── page.tsx          # Main dashboard
│   ├── components/           # React components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   └── ui/              # Reusable UI components
│   ├── services/            # Backend services
│   │   ├── field-incidents-service.ts
│   │   ├── incident-service.ts
│   │   ├── kobo-sync-service.ts
│   │   └── firebase-news-service.ts
│   └── lib/                 # Utilities and helpers
├── scripts/                 # Standalone scripts
│   └── kobo-sync.ts        # KoBo sync job
├── .github/workflows/      # GitHub Actions
│   └── kobo-sync.yml       # Automated field report sync
└── public/                 # Static assets
```

##  Automated Workflows

### KoBo Sync (GitHub Actions)
- **Frequency**: Every 30 minutes
- **Purpose**: Sync field reports from KoBoToolbox
- **Location**: `.github/workflows/kobo-sync.yml`
- **Manual Trigger**: Available in GitHub Actions tab

##  Tech Stack

- **Framework**: Next.js 15.3.3 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Firebase Firestore
- **AI**: Google Gemini (via Genkit)
- **Maps**: Leaflet + OpenStreetMap
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

##  Security

- Server-side authentication for admin dashboard
- Environment variables for sensitive credentials
- Firebase security rules for Firestore access
- CORS protection on API routes

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is developed for the Ethiopian Red Cross Society.

##  Acknowledgments

- Ethiopian Red Cross Society (ERCS)
- International Federation of Red Cross and Red Crescent Societies (IFRC)
- Google Gemini AI
- Next.js and Vercel teams

---

**Made with ❤️ for humanitarian response**

<!-- Force deploy: 2025-10-16 -->
