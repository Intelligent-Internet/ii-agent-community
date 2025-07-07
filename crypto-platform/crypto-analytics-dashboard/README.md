# 🚀 Crypto Analytics Dashboard

A modern, full-stack cryptocurrency analytics platform with AI-powered price predictions, real-time market data, and comprehensive user management.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1a/00ff00?text=Crypto+Analytics+Dashboard)

## ✨ Features

### 🔐 **Secure Authentication**
- User registration and login with bcrypt password hashing
- NextAuth.js integration with session management
- Secure password validation and error handling

### 📊 **Real-time Market Data**
- Live cryptocurrency prices from CoinGecko API
- Interactive charts with multiple timeframes
- Market cap, volume, and price change tracking

### 🪙 **Individual Coin Analytics**
- Dedicated pages for each cryptocurrency
- Advanced Chart.js visualizations
- Historical price data and trends

### 📰 **News Integration**
- Real-time cryptocurrency news from CryptoCompare
- AI-powered sentiment analysis (positive/negative/neutral)
- Past 3 days news filtering

### 🤖 **AI-Powered Predictions**
- OpenAI GPT integration for market analysis
- User-configurable API keys
- Intelligent price direction predictions
- Fallback technical analysis algorithms

### 🎨 **Beautiful UI/UX**
- Modern dark mode design with Nunito Sans font
- Responsive layout for all devices
- Professional loading states and animations
- Comprehensive error handling and user feedback

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Chart.js** - Interactive data visualizations

### Backend
- **NextAuth.js** - Authentication solution
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Production database
- **bcrypt** - Password hashing

### APIs & Services
- **CoinGecko API** - Cryptocurrency market data
- **CryptoCompare API** - News and market information
- **OpenAI API** - AI-powered predictions

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
