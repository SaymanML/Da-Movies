import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    overview: {
      type: String,
      default: ''
    },
    release_date: {
      type: String,
      default: ''
    },
    year: {
      type: Number
    },
    runtime: {
      type: Number,
      min: [0, 'Runtime must be a positive number']
    },
    vote_average: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    vote_count: {
      type: Number,
      min: 0,
      default: 0
    },
    poster_path: {
      type: String,
      default: null
    },
    backdrop_path: {
      type: String,
      default: null
    },
    genres: {
      type: [String],
      default: []
    },
    genre_ids: {
      type: [Number],
      default: []
    },
    director: {
      type: String,
      default: null
    },
    cast: {
      type: [String],
      default: []
    },
    streaming_providers: {
      type: mongoose.Schema.Types.Mixed,
      default: { IN: [], US: [] }
    },
    tmdb_id: {
      type: Number,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: auto-extract year from release_date if year is not provided
movieSchema.pre('save', function (next) {
  if (!this.year && this.release_date && this.release_date.length >= 4) {
    const parsed = parseInt(this.release_date.substring(0, 4), 10);
    if (!isNaN(parsed)) {
      this.year = parsed;
    }
  }
  next();
});

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

export default Movie;
