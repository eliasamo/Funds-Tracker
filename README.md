# Fund Tracker

A personal fintech dashboard for look-through fund analysis. Search any fund by name, view its underlying stock positions with country exposure, and get an aggregated real-time news feed for every holding in the fund.

## Features

- Search and add any mutual fund by name
- Real-time news feed aggregated across all fund holdings
- Holdings breakdown with country flags, sectors, and weight percentages
- Country exposure summary
- Filter news by country and sector

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (PostgreSQL)
- **Finnhub** — stock news and company data
- **Avanza** — fund and holdings data

# Fund Tracker

A personal fintech dashboard for look-through fund analysis. Search any fund by name, view its underlying stock positions with country exposure, and get an aggregated real-time news feed for every holding in the fund.


## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Stock-Tracker.git
cd Stock-Tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project and add your API keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
FINNHUB_API_KEY=your_finnhub_api_key
```

### 4. Run the development server

Open a terminal in the project folder and run:

```bash
npm run dev
```

### 5. Open the app

Go to [http://localhost:3000](http://localhost:3000) in your browser.