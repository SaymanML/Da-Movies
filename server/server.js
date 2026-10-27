import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import {
  isApiKeyConfigured,
  getGenres,
  searchPerson,
  getCandidates,
  getMovieDetails,
  getDirectorDetails,
  FALLBACK_MOVIES
} from './tmdbService.js';
import { rankMovies } from './recommendationEngine.js';
import { connectDB, isDbConnected } from './db.js';
import Movie from './models/Movie.js';
import Wishlist from './models/Wishlist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_REGION = process.env.DEFAULT_REGION || 'IN';

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize MongoDB connection (non-blocking, will not crash if offline)
connectDB();

// API Status & Configuration endpoint
app.get('/api/status', (req, res) => {
  const configured = isApiKeyConfigured();
  const dbConnected = isDbConnected();

  res.json({
    status: 'ok',
    isConfigured: configured,
    database: {
      connected: dbConnected,
      status: dbConnected ? 'connected' : 'disconnected',
      message: dbConnected
        ? 'MongoDB connected and operational.'
        : 'MongoDB is disconnected. Running in fallback demo mode.'
    },
    defaultRegion: DEFAULT_REGION,
    message: configured
      ? 'TMDB API is fully configured.'
      : 'Running in demo mode with curated blockbuster catalog. Add your free TMDB_API_KEY in server/.env for live access.'
  });
});

// Genre list
app.get('/api/genres', async (req, res) => {
  try {
    const genres = await getGenres();
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error.message);
    res.status(500).json({ error: 'Failed to retrieve genre metadata' });
  }
});

// Person autocomplete for Cast & Director
app.get('/api/search/person', async (req, res) => {
  try {
    const query = req.query.query || '';
    if (!query.trim()) {
      return res.json([]);
    }
    const results = await searchPerson(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching person:', error.message);
    res.status(500).json({ error: 'Failed to search person' });
  }
});

// Priority-aware movie recommendations
app.post('/api/movies/recommend', async (req, res) => {
  try {
    const { filters = {}, region = DEFAULT_REGION } = req.body;
    
    // Extract query parameters for candidate retrieval
    const candidateQuery = {
      searchQuery: filters.searchQuery || '',
      year: (filters.year && filters.year.mode !== 'OFF') ? filters.year.value : null
    };

    // If genre is set, find genre ID if provided
    if (filters.genre && filters.genre.mode !== 'OFF' && filters.genre.genreId) {
      candidateQuery.genreId = filters.genre.genreId;
    }
    // If director is set
    if (filters.director && filters.director.mode !== 'OFF' && filters.director.personId) {
      candidateQuery.personId = filters.director.personId;
    }

    const candidates = await getCandidates(candidateQuery, region);
    const ranked = rankMovies(candidates, filters);

    res.json(ranked);
  } catch (error) {
    console.error('Error ranking recommendations:', error.message);
    res.status(500).json({ error: 'Internal recommendation engine error' });
  }
});

// --- Genuine MongoDB CRUD Endpoints ---

// 1. GET /api/movies - Read movie records
app.get('/api/movies', async (req, res) => {
  try {
    if (isDbConnected()) {
      const dbMovies = await Movie.find().sort({ createdAt: -1 });
      return res.json(dbMovies);
    }
    // Honest fallback if MongoDB is not connected
    return res.json(FALLBACK_MOVIES);
  } catch (error) {
    console.error('Error fetching movies:', error.message);
    res.status(500).json({ error: 'Failed to retrieve movie records' });
  }
});

// 2. POST /api/movies - Create a movie record
app.post('/api/movies', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database unavailable. Cannot create movie while MongoDB is disconnected.'
      });
    }

    const {
      title,
      overview,
      release_date,
      year,
      runtime,
      vote_average,
      vote_count,
      poster_path,
      backdrop_path,
      genres,
      genre_ids,
      director,
      cast,
      streaming_providers
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Movie title is required' });
    }

    if (runtime !== undefined && (typeof runtime !== 'number' || runtime < 0)) {
      return res.status(400).json({ error: 'Runtime must be a non-negative number' });
    }

    if (vote_average !== undefined && (typeof vote_average !== 'number' || vote_average < 0 || vote_average > 10)) {
      return res.status(400).json({ error: 'Vote average must be a number between 0 and 10' });
    }

    let calculatedYear = year;
    if (!calculatedYear && release_date && release_date.length >= 4) {
      const parsed = parseInt(release_date.substring(0, 4), 10);
      if (!isNaN(parsed)) calculatedYear = parsed;
    }

    const movie = new Movie({
      title: title.trim(),
      overview: overview || '',
      release_date: release_date || '',
      year: calculatedYear,
      runtime,
      vote_average: vote_average !== undefined ? vote_average : 0,
      vote_count: vote_count !== undefined ? vote_count : 0,
      poster_path: poster_path || null,
      backdrop_path: backdrop_path || null,
      genres: Array.isArray(genres) ? genres : [],
      genre_ids: Array.isArray(genre_ids) ? genre_ids : [],
      director: director || null,
      cast: Array.isArray(cast) ? cast : [],
      streaming_providers: streaming_providers || { IN: [], US: [] }
    });

    const saved = await movie.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating movie:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

// 3. GET /api/movies/:id - Read one movie by ID (Database ID or TMDB/Fallback ID)
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.query.region || DEFAULT_REGION;

    // Check if ID is a valid MongoDB ObjectId and MongoDB is connected
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const dbMovie = await Movie.findById(id);
      if (dbMovie) {
        return res.json(dbMovie);
      }
    }

    // Preserve existing TMDB / fallback movie detail behavior for numeric or external IDs
    const movie = await getMovieDetails(id, region);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(movie);
  } catch (error) {
    console.error(`Error fetching movie ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// 4. PUT /api/movies/:id - Update a movie record in MongoDB
app.put('/api/movies/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database unavailable. Cannot update movie while MongoDB is disconnected.'
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }

    if (req.body.title !== undefined && (typeof req.body.title !== 'string' || !req.body.title.trim())) {
      return res.status(400).json({ error: 'Movie title cannot be empty' });
    }

    if (req.body.runtime !== undefined && (typeof req.body.runtime !== 'number' || req.body.runtime < 0)) {
      return res.status(400).json({ error: 'Runtime must be a non-negative number' });
    }

    if (req.body.vote_average !== undefined && (typeof req.body.vote_average !== 'number' || req.body.vote_average < 0 || req.body.vote_average > 10)) {
      return res.status(400).json({ error: 'Vote average must be a number between 0 and 10' });
    }

    const updated = await Movie.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ error: 'Movie record not found' });
    }

    return res.json(updated);
  } catch (error) {
    console.error(`Error updating movie ${req.params.id}:`, error.message);
    return res.status(400).json({ error: error.message });
  }
});

// 5. DELETE /api/movies/:id - Delete a movie record in MongoDB
app.delete('/api/movies/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database unavailable. Cannot delete movie while MongoDB is disconnected.'
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }

    const deleted = await Movie.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Movie record not found' });
    }

    return res.json({ message: 'Movie deleted successfully', id });
  } catch (error) {
    console.error(`Error deleting movie ${req.params.id}:`, error.message);
    return res.status(500).json({ error: 'Failed to delete movie' });
  }
});

// --- Genuine Wishlist CRUD Endpoints ---

// GET /api/wishlist - Read wishlist records
app.get('/api/wishlist', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database is disconnected. Wishlist is unavailable offline.',
        items: []
      });
    }
    const items = await Wishlist.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching wishlist:', error.message);
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

// POST /api/wishlist - Add movie to wishlist
app.post('/api/wishlist', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database is disconnected. Wishlist changes cannot be saved to MongoDB.'
      });
    }
    const { movieId, title, poster_path, year, runtime, vote_average, genres, director, notes } = req.body;
    if (!movieId) {
      return res.status(400).json({ error: 'Movie ID is required' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Movie title is required' });
    }

    const existing = await Wishlist.findOne({ movieId: String(movieId) });
    if (existing) {
      return res.status(409).json({ error: 'Movie is already in your wishlist', item: existing });
    }

    const newItem = new Wishlist({
      movieId: String(movieId),
      title,
      poster_path: poster_path || null,
      year: year || null,
      runtime: runtime || null,
      vote_average: vote_average || 0,
      genres: Array.isArray(genres) ? genres : [],
      director: director || null,
      notes: notes || ''
    });

    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error adding to wishlist:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/wishlist/:movieId - Update wishlist item (e.g., notes)
app.put('/api/wishlist/:movieId', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database is disconnected. Wishlist changes cannot be saved to MongoDB.'
      });
    }
    const updated = await Wishlist.findOneAndUpdate(
      { movieId: String(req.params.movieId) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Movie not found in wishlist' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating wishlist item:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/wishlist/:movieId - Remove movie from wishlist
app.delete('/api/wishlist/:movieId', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database is disconnected. Wishlist changes cannot be saved to MongoDB.'
      });
    }
    const deleted = await Wishlist.findOneAndDelete({ movieId: String(req.params.movieId) });
    if (!deleted) {
      return res.status(404).json({ error: 'Movie not found in wishlist' });
    }
    res.json({ message: 'Movie removed from wishlist', movieId: req.params.movieId });
  } catch (error) {
    console.error('Error deleting from wishlist:', error.message);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Director Details
app.get('/api/director/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const director = await getDirectorDetails(id);

    if (!director) {
      return res.status(404).json({ error: 'Director not found' });
    }

    res.json(director);
  } catch (error) {
    console.error(`Error fetching director ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch director profile' });
  }
});

app.listen(PORT, () => {
  console.log(`🎬 Da Movies Server running on http://localhost:${PORT}`);
  console.log(`🔑 TMDB API Status: ${isApiKeyConfigured() ? 'CONFIGURED' : 'DEMO MODE (Ready with curated catalog)'}`);
  console.log(`🍃 MongoDB Status: ${isDbConnected() ? 'CONNECTED' : 'DISCONNECTED (Fallback demo mode)'}`);
});
