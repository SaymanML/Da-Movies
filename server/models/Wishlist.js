import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    poster_path: {
      type: String,
      default: null
    },
    year: {
      type: Number,
      default: null
    },
    runtime: {
      type: Number,
      default: null
    },
    vote_average: {
      type: Number,
      default: 0
    },
    genres: {
      type: [String],
      default: []
    },
    director: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
