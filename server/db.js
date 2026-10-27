import mongoose from 'mongoose';
import Movie from './models/Movie.js';
import { FALLBACK_MOVIES } from './tmdbService.js';

let isConnected = false;

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    console.log('ℹ️ MONGODB_URI is not set. Running with in-memory demo catalog.');
    isConnected = false;
    return false;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 4000 // Fast fail if cluster is unreachable, avoid hanging server
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB successfully.');

    // Seed database if empty
    try {
      const count = await Movie.countDocuments();
      if (count === 0 && Array.isArray(FALLBACK_MOVIES) && FALLBACK_MOVIES.length > 0) {
        console.log(`🌱 Seeding ${FALLBACK_MOVIES.length} curated demo movies into MongoDB...`);
        const seedData = FALLBACK_MOVIES.map(m => ({
          title: m.title,
          overview: m.overview,
          release_date: m.release_date,
          year: m.year,
          runtime: m.runtime,
          vote_average: m.vote_average,
          vote_count: m.vote_count,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          genres: m.genres,
          genre_ids: m.genre_ids,
          director: m.director,
          cast: m.cast,
          streaming_providers: m.streaming_providers,
          tmdb_id: m.id
        }));
        await Movie.insertMany(seedData);
        console.log('✅ MongoDB seeded successfully.');
      }
    } catch (seedErr) {
      console.warn('⚠️ Seeding skipped or failed:', seedErr.message);
    }

    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection unavailable: ${error.message}. Running in fallback demo mode.`);
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.warn('⚠️ MongoDB connection error:', err.message);
  isConnected = false;
});
