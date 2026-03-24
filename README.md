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

## XGBoost Signals Pipeline (Local)

The project now includes a local XGBoost pipeline used by the Signals page.

### 1. Install Python packages

Install these into your Python environment:

```bash
pip install xgboost pandas numpy scikit-learn fastapi uvicorn
```

### 2. Train the model

```bash
npm run train:xgboost
```

To build training data from your real Supabase holdings/news + Finnhub price history
and then train in one step:

```bash
npm run train:signals
```

This will create `ml/data/signals_training.csv` and then train from it.
The builder needs these env vars (already used by the app):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FINNHUB_API_KEY`

This writes:

- `ml/models/xgboost_signals.json`
- `ml/models/xgboost_signals.meta.json`

If `ml/data/signals_training.csv` is missing, the trainer uses
`ml/data/signals_training.sample.csv` so you can verify the pipeline end-to-end.

Training now calibrates:

- action thresholds (`buy` / `sell`) from score distribution
- confidence scaling from model score magnitude

These values are exported by the scorer and used by `/api/signals` for action mapping.

### 3. Start the scoring service

```bash
npm run serve:xgboost
```

Service URL: `http://127.0.0.1:8008/score`

### 4. Open the Signals page

Use the Signals icon/button from the dashboard tab bar.

If the local service is not running, `/api/signals` falls back to the built-in heuristic scorer so the page still works.