import argparse
import csv
import json
import os
import shutil
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


EXCHANGE_SUFFIX_BY_COUNTRY = {
    "SE": ".ST",
    "DK": ".CO",
    "FI": ".HE",
    "NO": ".OL",
    "DE": ".DE",
    "UK": ".L",
    "GB": ".L",
    "US": "",
}


POSITIVE_WORDS = {
    "beats",
    "beat",
    "surge",
    "rally",
    "growth",
    "profit",
    "profits",
    "upgrade",
    "strong",
    "record",
    "bullish",
    "outperform",
    "expands",
    "expansion",
    "partnership",
    "upside",
    "rebound",
}

NEGATIVE_WORDS = {
    "miss",
    "misses",
    "drop",
    "falls",
    "fall",
    "loss",
    "losses",
    "downgrade",
    "weak",
    "warning",
    "bearish",
    "lawsuit",
    "cuts",
    "cut",
    "decline",
    "slump",
    "risk",
    "risks",
}


@dataclass
class Holding:
    fund_isin: str
    ticker: str
    weight_percentage: float
    country: str


@dataclass
class NewsArticle:
    published_date: date
    headline: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build real signals training dataset from Supabase + Finnhub"
    )
    parser.add_argument(
        "--out",
        default="ml/data/signals_training.csv",
        help="Output CSV path",
    )
    parser.add_argument(
        "--lookback-days",
        type=int,
        default=540,
        help="How many days of market data to request",
    )
    parser.add_argument(
        "--horizon-days",
        type=int,
        default=5,
        help="Forward return horizon in market days",
    )
    parser.add_argument(
        "--min-rows",
        type=int,
        default=120,
        help="Minimum dataset rows required",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail instead of using sample fallback when real dataset is too small",
    )
    parser.add_argument(
        "--sleep-ms",
        type=int,
        default=150,
        help="Pause between external API calls to avoid rate bursts",
    )
    return parser.parse_args()


def load_env_files() -> None:
    """
    Lightweight .env loader so this script can run from npm scripts
    without requiring users to export variables manually in PowerShell.
    """
    for env_name in (".env.local", ".env"):
        env_path = Path(env_name)
        if not env_path.exists():
            continue

        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[len("export ") :].strip()
            if "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()

            # Preserve existing shell environment values if already provided.
            if not key or key in os.environ:
                continue

            if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                value = value[1:-1]

            os.environ[key] = value


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def supabase_get(
    supabase_url: str,
    supabase_key: str,
    table: str,
    params: dict[str, str],
) -> list[dict[str, Any]]:
    query = urlencode(params)
    url = f"{supabase_url}/rest/v1/{table}?{query}"

    req = Request(
        url,
        headers={
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(req, timeout=30) as resp:
            payload = resp.read().decode("utf-8")
            data = json.loads(payload)
            if not isinstance(data, list):
                return []
            return data
    except HTTPError as err:
        detail = err.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Supabase request failed [{err.code}] for {table}: {detail}")
    except URLError as err:
        raise RuntimeError(f"Supabase connection error for {table}: {err}")


def fetch_holdings(supabase_url: str, supabase_key: str) -> list[Holding]:
    stock_rows = supabase_get(
        supabase_url,
        supabase_key,
        "stocks",
        {
            "select": "ticker,country",
            "limit": "10000",
        },
    )
    country_by_ticker: dict[str, str] = {}
    for row in stock_rows:
        ticker = (row.get("ticker") or "").strip().upper()
        country = (row.get("country") or "").strip().upper()
        if ticker:
            country_by_ticker[ticker] = country

    rows = supabase_get(
        supabase_url,
        supabase_key,
        "fund_holdings",
        {
            "select": "fund_isin,stock_ticker,weight_percentage",
            "limit": "10000",
            "order": "fund_isin.asc,stock_ticker.asc",
        },
    )

    holdings: list[Holding] = []
    for row in rows:
        fund_isin = (row.get("fund_isin") or "").strip()
        ticker = (row.get("stock_ticker") or "").strip().upper()
        weight = row.get("weight_percentage")
        if not fund_isin or not ticker or weight is None:
            continue
        holdings.append(
            Holding(
                fund_isin=fund_isin,
                ticker=ticker,
                weight_percentage=float(weight),
                country=country_by_ticker.get(ticker, ""),
            )
        )

    return holdings


def fetch_news_by_ticker(
    supabase_url: str, supabase_key: str
) -> dict[str, list[NewsArticle]]:
    rows = supabase_get(
        supabase_url,
        supabase_key,
        "news_articles",
        {
            "select": "related_ticker,headline,published_at",
            "limit": "10000",
            "order": "published_at.asc",
        },
    )

    out: dict[str, list[NewsArticle]] = defaultdict(list)

    for row in rows:
        ticker = (row.get("related_ticker") or "").strip().upper()
        published_at = row.get("published_at")
        if not ticker or not published_at:
            continue

        try:
            dt = datetime.fromisoformat(str(published_at).replace("Z", "+00:00"))
            published_date = dt.date()
        except ValueError:
            continue

        headline = (row.get("headline") or "").strip()
        out[ticker].append(NewsArticle(published_date=published_date, headline=headline))

    return out


def to_unix(d: date) -> int:
    return int(datetime(d.year, d.month, d.day, tzinfo=timezone.utc).timestamp())


def strip_suffix(ticker: str) -> str:
    if "." not in ticker:
        return ticker
    return ticker.split(".")[0]


def ticker_variants(ticker: str, country: str) -> list[str]:
    """
    Generate likely symbol variants for provider compatibility.
    Example: VOLV-B.ST -> VOLV-B.ST, VOLV-B, VOLVB.ST, VOLVB
    """
    base = ticker.strip().upper()
    out: list[str] = []

    def add(sym: str) -> None:
        s = sym.strip().upper()
        if s and s not in out:
            out.append(s)

    add(base)
    plain = strip_suffix(base)
    add(plain)
    add(plain.replace("-", ""))
    add(plain.replace("-", "."))

    suffix = EXCHANGE_SUFFIX_BY_COUNTRY.get(country.upper(), "")
    if suffix and not plain.endswith(suffix):
        add(f"{plain}{suffix}")
        add(f"{plain.replace('-', '')}{suffix}")

    return out


def parse_candles_payload(payload: dict[str, Any]) -> list[tuple[date, float]]:
    if payload.get("s") != "ok":
        return []

    ts_list = payload.get("t") or []
    close_list = payload.get("c") or []
    if not ts_list or not close_list or len(ts_list) != len(close_list):
        return []

    points: list[tuple[date, float]] = []
    for ts, close in zip(ts_list, close_list):
        try:
            day = datetime.fromtimestamp(int(ts), tz=timezone.utc).date()
            points.append((day, float(close)))
        except Exception:
            continue
    return points


def fetch_finnhub_candles(
    finnhub_key: str,
    symbol: str,
    from_ts: int,
    to_ts: int,
) -> list[tuple[date, float]]:
    query = urlencode(
        {
            "symbol": symbol,
            "resolution": "D",
            "from": str(from_ts),
            "to": str(to_ts),
            "token": finnhub_key,
        }
    )
    url = f"https://finnhub.io/api/v1/stock/candle?{query}"
    req = Request(url, headers={"Accept": "application/json"})

    try:
        with urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return []

    return parse_candles_payload(payload)


def fetch_yahoo_candles(
    symbol: str,
    from_ts: int,
    to_ts: int,
) -> list[tuple[date, float]]:
    query = urlencode(
        {
            "period1": str(from_ts),
            "period2": str(to_ts),
            "interval": "1d",
            "events": "history",
            "includeAdjustedClose": "true",
        }
    )
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?{query}"
    req = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
    )

    try:
        with urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return []

    chart = (payload.get("chart") or {}).get("result") or []
    if not chart:
        return []
    item = chart[0]
    ts_list = item.get("timestamp") or []
    quote = (((item.get("indicators") or {}).get("quote") or [{}])[0])
    close_list = quote.get("close") or []

    if not ts_list or not close_list:
        return []

    points: list[tuple[date, float]] = []
    for ts, close in zip(ts_list, close_list):
        if close is None:
            continue
        try:
            day = datetime.fromtimestamp(int(ts), tz=timezone.utc).date()
            points.append((day, float(close)))
        except Exception:
            continue
    return points


def fetch_candles(
    finnhub_key: str,
    ticker: str,
    country: str,
    from_ts: int,
    to_ts: int,
) -> list[tuple[date, float]]:
    symbols_to_try = ticker_variants(ticker, country)

    for symbol in symbols_to_try:
        points = fetch_finnhub_candles(finnhub_key, symbol, from_ts, to_ts)
        if points:
            return points

        points = fetch_yahoo_candles(symbol, from_ts, to_ts)
        if points:
            return points

    return []


def headline_sentiment(headline: str) -> float:
    text = headline.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in text)
    neg = sum(1 for w in NEGATIVE_WORDS if w in text)

    if pos == 0 and neg == 0:
        return 0.0

    raw = (pos - neg) / max(1, pos + neg)
    return max(-1.0, min(1.0, raw))


def build_news_window_features(articles: list[NewsArticle], snapshot: date) -> tuple[float, int, float, float, float]:
    start = snapshot - timedelta(days=6)
    in_window = [a for a in articles if start <= a.published_date <= snapshot]

    if not in_window:
        return (0.0, 0, 0.0, 0.0, 0.0)

    scores = [headline_sentiment(a.headline) for a in in_window]
    count = len(scores)
    signed_avg = float(sum(scores) / count)

    positive = sum(1 for s in scores if s > 0)
    negative = sum(1 for s in scores if s < 0)
    neutral = count - positive - negative

    return (
        signed_avg,
        count,
        positive / count,
        negative / count,
        neutral / count,
    )


def main() -> None:
    args = parse_args()
    load_env_files()

    supabase_url = require_env("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = require_env("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    finnhub_key = require_env("FINNHUB_API_KEY")

    holdings = fetch_holdings(supabase_url, supabase_key)
    if not holdings:
        raise RuntimeError("No holdings found in fund_holdings table.")

    news_by_ticker = fetch_news_by_ticker(supabase_url, supabase_key)

    unique_tickers = sorted({h.ticker for h in holdings})
    print(f"Found {len(holdings)} holdings across {len(unique_tickers)} tickers")

    today = datetime.now(timezone.utc).date()
    from_day = today - timedelta(days=args.lookback_days)
    from_ts = to_unix(from_day)
    to_ts = to_unix(today)

    prices_by_ticker: dict[str, list[tuple[date, float]]] = {}
    candles_found = 0
    for idx, ticker in enumerate(unique_tickers, start=1):
        sample_holding = next((h for h in holdings if h.ticker == ticker), None)
        country = sample_holding.country if sample_holding else ""
        candles = fetch_candles(finnhub_key, ticker, country, from_ts, to_ts)
        if candles:
            prices_by_ticker[ticker] = candles
            candles_found += 1
        if idx % 15 == 0 or idx == len(unique_tickers):
            print(f"Fetched candles for {idx}/{len(unique_tickers)} tickers")
        time.sleep(max(0, args.sleep_ms) / 1000)

    print(f"Candle coverage: {candles_found}/{len(unique_tickers)} tickers")

    rows: list[dict[str, Any]] = []
    horizon = max(1, args.horizon_days)

    for h in holdings:
        ticker_prices = prices_by_ticker.get(h.ticker)
        if not ticker_prices or len(ticker_prices) <= horizon:
            continue

        ticker_news = news_by_ticker.get(h.ticker, [])

        for i in range(0, len(ticker_prices) - horizon):
            snapshot_date, close_now = ticker_prices[i]
            _, close_future = ticker_prices[i + horizon]
            if close_now <= 0:
                continue

            target_return = (close_future / close_now) - 1.0
            (
                avg_sentiment,
                news_count,
                positive_share,
                negative_share,
                neutral_share,
            ) = build_news_window_features(ticker_news, snapshot_date)

            rows.append(
                {
                    "snapshot_date": snapshot_date.isoformat(),
                    "fund_isin": h.fund_isin,
                    "ticker": h.ticker,
                    "holdingWeight": round(float(h.weight_percentage), 6),
                    "newsCount7d": int(news_count),
                    "avgSentiment": round(float(avg_sentiment), 6),
                    "positiveShare": round(float(positive_share), 6),
                    "negativeShare": round(float(negative_share), 6),
                    "neutralShare": round(float(neutral_share), 6),
                    "target_return_5d": round(float(target_return), 8),
                }
            )

    if len(rows) < args.min_rows:
        sample_path = Path("ml/data/signals_training.sample.csv")
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        if args.strict:
            raise RuntimeError(
                f"Dataset too small: {len(rows)} rows (< {args.min_rows}). Try larger --lookback-days."
            )

        if sample_path.exists():
            shutil.copyfile(sample_path, out_path)
            print(
                "WARNING: Real dataset too small "
                f"({len(rows)} rows < {args.min_rows}). "
                f"Fell back to sample dataset at {sample_path}."
            )
            print(f"Output: {out_path}")
            return

        raise RuntimeError(
            "Dataset too small and no sample fallback found. "
            f"Expected {sample_path}."
        )

    rows.sort(key=lambda r: (r["snapshot_date"], r["fund_isin"], r["ticker"]))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    columns = [
        "snapshot_date",
        "fund_isin",
        "ticker",
        "holdingWeight",
        "newsCount7d",
        "avgSentiment",
        "positiveShare",
        "negativeShare",
        "neutralShare",
        "target_return_5d",
    ]

    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Built dataset with {len(rows)} rows")
    print(f"Rows/ticker avg: {len(rows) / max(1, candles_found):.1f}")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()