<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.4-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=for-the-badge&logo=google" alt="Gemini AI"/>
</p>

<h1 align="center">
  <br>
  <span style="font-size: 3rem;">⚡</span>
  <br>
  SentimentPulse
  <br>
</h1>

<h4 align="center">AI-Powered Real-Time Public Sentiment Analysis for Government Policies</h4>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#️-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
</p>

---

## 📋 Overview

**SentimentPulse** is a sophisticated web application that leverages Google's Gemini 2.0 Flash AI model with real-time Google Search grounding to analyze and visualize public sentiment about government policies in India. The platform aggregates opinions from news articles, social media platforms (Twitter/X, Reddit), and public forums to provide actionable insights for policymakers, researchers, and citizens.

### 🎯 Problem Statement

Government agencies and policymakers often lack real-time visibility into how the public perceives their initiatives. Traditional feedback mechanisms are slow, biased, or limited in scope. SentimentPulse bridges this gap by:

- Providing **instant sentiment analysis** of any government policy
- Aggregating **multi-source data** from news, social media, and forums
- Offering **AI-generated summaries** with grounded, verifiable sources
- Visualizing sentiment through **interactive charts and metrics**

---

## ✨ Features

### 🔍 Core Functionality

| Feature | Description |
|---------|-------------|
| **AI Sentiment Analysis** | Powered by Google Gemini 2.0 Flash with real-time grounding |
| **Multi-Source Aggregation** | Collects data from news, Twitter, Reddit, and forums |
| **Sentiment Score** | -100 to +100 scale indicating overall public opinion |
| **Distribution Breakdown** | Percentage split of positive, negative, and neutral sentiments |
| **Key Topics Extraction** | Identifies trending topics within policy discussions |
| **Recent Mentions** | Displays actual quotes and paraphrases from public sources |
| **Concerns & Positives** | Categorized lists of main public concerns and appreciated aspects |
| **Source Attribution** | Links to original sources for verification |


---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.4 | React framework with App Router |
| **React** | 19.2.3 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.0 | Utility-first CSS framework |
| **Framer Motion** | 12.29.0 | Animation library |
| **Recharts** | 3.7.0 | Data visualization |
| **Lucide React** | 0.563.0 | Icon library |
| **React Markdown** | 10.1.0 | Markdown rendering |

### Backend / API

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **Google Generative AI SDK** | Gemini 2.0 Flash integration |
| **Google Search Grounding** | Real-time web search for AI responses |

### Typography

| Font | Usage |
|------|-------|
| **Space Grotesk** | Display text |
| **Outfit** | Headings |
| **Plus Jakarta Sans** | Body text |

---


## 🏗️ Architecture

### Project Structure

```
frontend/
├── public/                     # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── search/
│   │   │   │   └── route.ts    # General search endpoint
│   │   │   └── sentiment/
│   │   │       └── route.ts    # Sentiment analysis endpoint
│   │   ├── favicon.ico
│   │   ├── globals.css         # Global styles & animations
│   │   ├── layout.tsx          # Root layout with fonts
│   │   └── page.tsx            # Main dashboard component
│   ├── components/
│   │   └── icons.tsx           # Custom SVG icons
│   └── fonts/
│       └── ClashDisplay-Variable.woff2
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### Data Flow

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   User Input   │────▶│  Next.js API    │────▶│  Google Gemini   │
│  (Policy Name) │     │  /api/sentiment │     │  2.0 Flash       │
└────────────────┘     └─────────────────┘     └──────────────────┘
                                                        │
                                                        ▼
┌────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Dashboard UI  │◀────│  JSON Response  │◀────│  Google Search   │
│  (Recharts)    │     │  with Sources   │     │  Grounding       │
└────────────────┘     └─────────────────┘     └──────────────────┘
```

### Component Architecture

```
Dashboard (page.tsx)
├── Header
│   ├── Logo
│   ├── Time Display
│   └── Live Status
├── Hero Section
│   ├── Title Animation
│   ├── Search Input
│   └── Policy Grid
├── Loading State
│   └── Animated Spinner
├── Error State
│   └── Retry Button
└── Results View
    ├── Score Display
    ├── Breakdown Cards
    ├── AI Summary
    ├── Charts Section
    │   ├── PieChart
    │   └── BarChart
    ├── Concerns/Positives
    ├── Recent Mentions
    └── Sources List
```

---


## 📝 License

This project is licensed under the MIT License.

