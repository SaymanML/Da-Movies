# 🎬 Da Movies — MERN Priority-Aware Movie Discovery & CRUD

> **No endless scrolling. Just exact cinema.**

Da Movies is a full-stack **MERN (MongoDB, Express, React, Node.js)** movie-discovery web application built for movie lovers who know what they want. Instead of treating every filter equally, Da Movies introduces a **priority-aware recommendation engine** where users independently configure each condition as **OFF**, **REQUIRED** (strict constraint), or **PREFERRED** (soft ranking booster).

---

## ✨ Features

- **MERN Stack with Genuine Database CRUD**:
  - Full MongoDB persistence with Mongoose schema modeling.
  - Automatic seeding of curated blockbuster catalog if database is freshly initialized.
  - Resilient offline fallback: if MongoDB is disconnected, the app continues functioning in Demo Mode without crashing.
- **Priority-Aware Filtering Engine**:
  - **OFF**: Filter is completely ignored.
  - **REQUIRED**: Strict non-negotiable filter. Violations or missing data immediately exclude the movie. Requirements are **never silently relaxed**.
  - **PREFERRED**: Soft preference. Satisfying the condition increases the movie's **Da Score** (0–100%) but never excludes an otherwise matching movie. All preferred filters share an equal, balanced weight.
- **Supported Discovery Filters**:
  - **Runtime / Duration**: Support for `<=`, `>=`, and `between` operators.
  - **Rating**: Support for `<=`, `>=`, and `between` operators (1.0 to 10.0 scale).
  - **Release Year**: Support for `<=`, `>=`, and `between` operators.
  - **Genre**: Multi-select pills for Action, Sci-Fi, Horror, Thriller, etc.
  - **Director**: Autocomplete search for world-class directors with profile page and filmography.
  - **Streaming Platform**: Netflix, Prime Video, Disney+ Hotstar, JioCinema, Apple TV, SonyLIV, Max.
- **Explainable Match Breakdown ("Why This Movie?")**:
  - Detailed breakdown on every card explaining exactly which preferences matched, which were missed, which requirements were met, and any unverified data.
- **Dedicated Movie Details & Director Profiles**:
  - Comprehensive metadata: overview, full credits, director bio, release date, and region-aware watch providers (defaulting to India `IN`).
- **Resilient Hybrid Architecture**:
  - Supports live TMDB API metadata as well as custom MongoDB records.

---

## 🛠️ Tech Stack

- **MongoDB & Mongoose**: Document database and object data modeling.
- **Express.js & Node.js**: Backend REST API architecture.
- **React 18 & Vite**: Fast frontend single-page application.
- **Styling**: Vanilla CSS with custom properties & Space Grotesk / Inter typography.
- **External Metadata**: The Movie Database (TMDB) API & JustWatch.

---

## 📡 REST API & CRUD Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/status` | System health, TMDB status & MongoDB connection state | `200` |
| `GET` | `/api/movies` | Read all database movie records (or fallback catalog if offline) | `200`, `500` |
| `POST` | `/api/movies` | Create a new movie record in MongoDB | `201`, `400`, `503` |
| `GET` | `/api/movies/:id` | Read one movie by MongoDB ObjectId or external TMDB ID | `200`, `404`, `500` |
| `PUT` | `/api/movies/:id` | Update an existing MongoDB movie record | `200`, `400`, `404`, `503` |
| `DELETE` | `/api/movies/:id` | Delete a movie record from MongoDB | `200`, `400`, `404`, `503` |
| `POST` | `/api/movies/recommend` | Run the priority-aware recommendation ranking engine | `200`, `500` |
| `GET` | `/api/wishlist` | Read user's saved wishlist movies from MongoDB | `200`, `503` |
| `POST` | `/api/wishlist` | Add a movie to wishlist (prevents duplicate entries) | `201`, `400`, `409`, `503` |
| `PUT` | `/api/wishlist/:movieId` | Update wishlist entry notes or metadata | `200`, `400`, `404`, `503` |
| `DELETE` | `/api/wishlist/:movieId` | Remove a movie from wishlist | `200`, `404`, `503` |
| `GET` | `/api/genres` | Retrieve available movie genres | `200`, `500` |
| `GET` | `/api/search/person` | Person autocomplete for Director search | `200`, `500` |
| `GET` | `/api/director/:id` | Retrieve director biography and filmography | `200`, `404`, `500` |

### Sample `POST /api/movies` Payload:
```json
{
  "title": "Dune: Part Two",
  "overview": "Paul Atreides unites with Chani and the Fremen on a path of revenge.",
  "release_date": "2024-03-01",
  "runtime": 166,
  "vote_average": 8.5,
  "genres": ["Science Fiction", "Adventure"],
  "director": "Denis Villeneuve",
  "cast": ["Timothée Chalamet", "Zendaya"],
  "streaming_providers": {
    "IN": ["JioCinema", "Prime Video"]
  }
}
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the following command in the project root to install all dependencies for root, client, and server:
```bash
npm run install:all
```

*(Alternatively, run `npm install` inside the root, `server/`, and `client/` directories).*

### 2. Configure Environment Variables
Copy or edit `server/.env`:
```env
PORT=5000

# MongoDB Connection String (Local mongod or MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/damovies

# TMDB v3 API Key (Optional: for live metadata across 900,000+ films)
TMDB_API_KEY=

# Default Region for streaming watch providers (e.g. IN, US, GB)
DEFAULT_REGION=IN
```

> **Note on MongoDB**: If `MONGODB_URI` is left blank or the database is temporarily unreachable, Da Movies operates gracefully in Demo Mode and reports the status accurately via `/api/status`.

### 3. Start the Application
Run both frontend and backend concurrently with one command from the project root:
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## ☁️ Deployment (Free-Tier Options)

Deploy the API on Render, the React site on Vercel, and use MongoDB Atlas for hosted data:

1. Create a MongoDB Atlas cluster and database user. Add the hosting provider's outbound access as allowed by Atlas network access settings, then copy the connection string privately.
2. Deploy the `server/` folder as a Render Web Service. Set the build command to `npm install` and start command to `npm start`. Add `MONGODB_URI`, `TMDB_API_KEY` (optional), and `DEFAULT_REGION=IN` as Render environment variables. Render provides `PORT` automatically.
3. Deploy the `client/` folder as a Vercel project. Set `VITE_API_URL` to the public Render service URL, without a trailing slash (for example, `https://your-service.onrender.com`). Redeploy after setting it.
4. Confirm the Render `/api/status` endpoint responds, then open the Vercel site and try movie search and wishlist features. Wishlist persistence requires MongoDB Atlas; the app can still show demo movie data without a database.

Keep credentials in the hosting providers' environment variable settings. Never commit `.env` files or paste database credentials into this README.

---

## 📐 Project Structure

```text
da-movies/
├── package.json              # Root package with concurrently scripts
├── .gitignore                # Git exclusions
├── README.md                 # Project documentation & setup instructions
├── server/
│   ├── package.json          # Server dependencies (Express, Mongoose, Axios, Dotenv)
│   ├── .env.example          # Sample environment variables
│   ├── .env                  # Server environment configuration
│   ├── db.js                 # MongoDB connection & auto-seeding manager
│   ├── models/
│   │   └── Movie.js          # Mongoose Movie schema & model
│   ├── server.js             # Express API server with CRUD routes
│   ├── tmdbService.js        # TMDB API client, caching & fallback catalogue
│   └── recommendationEngine.js # Priority-aware scoring engine (uniform preferred weights)
└── client/
    ├── package.json          # React, Vite, Lucide React
    ├── vite.config.js        # Vite config with API proxy
    ├── index.html            # Google Fonts (Space Grotesk & Inter) & meta
    └── src/
        ├── index.css         # Dark Gen-Z theme, tokens & responsive styles
        ├── main.jsx          # React DOM entry point
        ├── App.jsx           # Master application state & orchestration
        └── components/
            ├── Navbar.jsx           # Branding & Region selector
            ├── Hero.jsx             # Tagline & Instant 1-click presets
            ├── FilterPanel.jsx      # OFF / REQUIRED / PREFERRED filter controls
            ├── MovieCard.jsx        # Movie card with Da Score & match breakdown
            ├── MovieDetailsModal.jsx# Complete details, cast & stream providers
            ├── DirectorModal.jsx    # Director biography & filmography
            ├── ConfigBanner.jsx     # Helpful status notification banner
            └── Footer.jsx           # TMDB attribution statement & branding
```

---

## 📜 TMDB Attribution & Terms

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie metadata, posters, and imagery are supplied courtesy of The Movie Database (TMDB). Streaming availability data is provided courtesy of JustWatch through TMDB.
