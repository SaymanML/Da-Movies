import React, { useState, useEffect } from 'react';
import { apiUrl } from './api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FilterPanel from './components/FilterPanel';
import MovieCard from './components/MovieCard';
import MovieDetailsModal from './components/MovieDetailsModal';
import DirectorModal from './components/DirectorModal';
import Footer from './components/Footer';
import { Sparkles, AlertOctagon, RefreshCw, Heart, AlertCircle, ArrowLeft } from 'lucide-react';

const INITIAL_FILTERS = {
  searchQuery: '',
  runtime: { mode: 'OFF', operator: '<=', value: 120, valueMax: 150 },
  rating: { mode: 'OFF', operator: '>=', value: 7.5, valueMax: 9.5 },
  year: { mode: 'OFF', operator: '>=', value: 2015, valueMax: 2024 },
  genre: { mode: 'OFF', genres: [], matchAll: false },
  director: { mode: 'OFF', personName: '' },
  streaming: { mode: 'OFF', providerName: '' }
};

export default function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [region, setRegion] = useState('IN');
  const [status, setStatus] = useState(null);
  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedDirectorId, setSelectedDirectorId] = useState(null);
  const [showDiscovery, setShowDiscovery] = useState(false);

  // Wishlist state (persisted in MongoDB via Mongoose)
  const [currentView, setCurrentView] = useState('discovery'); // 'discovery' | 'wishlist'
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistError, setWishlistError] = useState(null);

  // Fetch initial API status
  useEffect(() => {
    fetch(apiUrl('/api/status'))
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        if (data.defaultRegion) setRegion(data.defaultRegion);
      })
      .catch((err) => console.error('Failed to get status:', err));
  }, []);

  // Fetch Wishlist from MongoDB
  const fetchWishlist = async () => {
    try {
      const res = await fetch(apiUrl('/api/wishlist'));
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(Array.isArray(data) ? data : []);
        setWishlistError(null);
      } else if (res.status === 503) {
        setWishlistError('MongoDB is disconnected. Wishlist changes cannot be saved.');
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setWishlistError('Unable to connect to database for wishlist.');
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Fetch recommendations
  const runRecommendation = async (currentFilters = filters, currentRegion = region) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/movies/recommend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: currentFilters,
          region: currentRegion
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMovies(data.results || []);
        setMeta(data.meta || {});
      } else {
        console.error('Recommendation request failed');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on initial load
  useEffect(() => {
    runRecommendation(INITIAL_FILTERS, region);
  }, [region]);

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    runRecommendation(INITIAL_FILTERS, region);
  };

  const handleApplyPreset = (presetFilter) => {
    const updated = {
      ...INITIAL_FILTERS,
      ...presetFilter
    };
    setFilters(updated);
    runRecommendation(updated, region);
  };

  // Convert all REQUIRED filters to PREFERRED with a single click
  const relaxRequirements = () => {
    const relaxed = { ...filters };
    Object.keys(relaxed).forEach((key) => {
      if (relaxed[key]?.mode === 'REQUIRED') {
        relaxed[key] = {
          ...relaxed[key],
          mode: 'PREFERRED'
        };
      }
    });
    setFilters(relaxed);
    runRecommendation(relaxed, region);
  };

  // Wishlist CRUD toggle
  const handleToggleWishlist = async (movie) => {
    const targetId = String(movie.id || movie.movieId);
    const existing = wishlistItems.find((w) => String(w.movieId) === targetId);

    if (existing) {
      // DELETE from MongoDB
      try {
        const res = await fetch(apiUrl(`/api/wishlist/${encodeURIComponent(targetId)}`), {
          method: 'DELETE'
        });
        if (res.ok) {
          setWishlistItems((prev) => prev.filter((w) => String(w.movieId) !== targetId));
          setWishlistError(null);
        } else if (res.status === 503) {
          setWishlistError('MongoDB is disconnected. Wishlist changes cannot be saved.');
        } else {
          const errData = await res.json();
          setWishlistError(errData.error || 'Failed to remove from wishlist');
        }
      } catch (err) {
        setWishlistError('Database error. Cannot remove from wishlist while MongoDB is offline.');
      }
    } else {
      // POST to MongoDB
      try {
        const res = await fetch(apiUrl('/api/wishlist'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movieId: targetId,
            title: movie.title,
            poster_path: movie.poster_path,
            year: movie.year,
            runtime: movie.runtime,
            vote_average: movie.vote_average,
            genres: movie.genres,
            director: movie.director
          })
        });

        if (res.ok) {
          const saved = await res.json();
          setWishlistItems((prev) => [saved, ...prev]);
          setWishlistError(null);
        } else if (res.status === 503) {
          setWishlistError('MongoDB is disconnected. Wishlist changes cannot be saved.');
        } else if (res.status === 409) {
          // Already in wishlist
          fetchWishlist();
        } else {
          const errData = await res.json();
          setWishlistError(errData.error || 'Failed to add to wishlist');
        }
      } catch (err) {
        setWishlistError('Database error. Cannot save to wishlist while MongoDB is offline.');
      }
    }
  };

  return (
    <div className="da-movies-app">
      {!showDiscovery ? (
        <main className="welcome-page">
          <div className="welcome-brand">
            <span className="logo-badge">DA</span>
            <span className="logo-text">MOVIES<span className="logo-dot">.</span></span>
          </div>
          <section className="welcome-content">
            <span className="welcome-eyebrow">A better way to choose</span>
            <h1 className="welcome-heading">Movies that fit your requirements</h1>
            <p className="welcome-description">
              Stop scrolling past films that do not fit. Match on length, ratings, year, and platform with our priority-aware recommendation engine.
            </p>
            <button
              type="button"
              className="welcome-action-btn"
              onClick={() => setShowDiscovery(true)}
              autoFocus
            >
              Start Discovery
            </button>
          </section>
        </main>
      ) : (
        <>
          {/* Navbar with Wishlist integration */}
          <Navbar
            status={status}
            region={region}
            onRegionChange={(newRegion) => {
              setRegion(newRegion);
              runRecommendation(filters, newRegion);
            }}
            onBack={() => setShowDiscovery(false)}
            currentView={currentView}
            onViewChange={setCurrentView}
            wishlistCount={wishlistItems.length}
          />

          {/* Database feedback banner if offline */}
          {wishlistError && (
            <div className="container" style={{ marginTop: '16px' }}>
              <div
                style={{
                  background: 'rgba(255, 0, 122, 0.12)',
                  border: '1px solid var(--neon-pink)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color="var(--neon-pink)" style={{ flexShrink: 0 }} />
                  <span>{wishlistError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWishlistError(null)}
                  style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* VIEW: WISHLIST */}
          {currentView === 'wishlist' ? (
            <main className="container" style={{ padding: '40px 24px', minHeight: '65vh' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Heart size={26} color="var(--neon-pink)" fill="var(--neon-pink)" />
                  <h2 style={{ fontSize: '2rem' }}>My Wishlist</h2>
                  <span className="results-meta-pill" style={{ borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}>
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'saved movie' : 'saved movies'}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-reset"
                  onClick={() => setCurrentView('discovery')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ArrowLeft size={16} /> Back to Movie Discovery
                </button>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="empty-state-card">
                  <Heart className="empty-state-icon" style={{ color: 'var(--neon-pink)' }} />
                  <h3 className="empty-state-title">Your Wishlist is Empty</h3>
                  <p className="empty-state-desc">
                    Browse movies in discovery mode and tap the heart icon on any movie poster to bookmark it into your MongoDB wishlist.
                  </p>
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => setCurrentView('discovery')}
                  >
                    Explore Discoveries
                  </button>
                </div>
              ) : (
                <div className="movies-grid">
                  {wishlistItems.map((item) => {
                    const formatted = {
                      id: item.movieId,
                      title: item.title,
                      poster_path: item.poster_path,
                      year: item.year,
                      runtime: item.runtime,
                      vote_average: item.vote_average,
                      genres: item.genres,
                      director: item.director
                    };
                    return (
                      <MovieCard
                        key={item.movieId}
                        movie={formatted}
                        onSelectMovie={(m) => setSelectedMovieId(m.id)}
                        onSelectDirector={(dId) => setSelectedDirectorId(dId)}
                        isWishlisted={true}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    );
                  })}
                </div>
              )}
            </main>
          ) : (
            /* VIEW: DISCOVERY */
            <>
              {/* Hero section */}
              <Hero onApplyPreset={handleApplyPreset} />

              {/* Main Content */}
              <main className="container">
                {/* Priority Filter Engine (Without Cast Member filter) */}
                <FilterPanel
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleReset}
                  onSubmit={() => runRecommendation(filters, region)}
                  loading={loading}
                />

                {/* Results Header Bar */}
                <div className="results-header">
                  <div className="results-count-title">
                    <Sparkles size={22} color="var(--neon-lime)" />
                    <span>Discoveries</span>
                    {meta && (
                      <span className="results-meta-pill">
                        {movies.length} {movies.length === 1 ? 'film matched' : 'films matched'}
                      </span>
                    )}
                  </div>

                  {meta?.requiredFiltersCount > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--neon-pink)',
                          background: 'var(--neon-pink-dim)',
                          border: '1px solid var(--neon-pink)',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-pill)'
                        }}
                      >
                        {meta.requiredFiltersCount} Strict Requirement{meta.requiredFiltersCount > 1 ? 's' : ''} Enforced
                      </span>
                    </div>
                  )}
                </div>

                {/* Loading state indicator */}
                {loading && (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="pulse-dot" style={{ margin: '0 auto 16px auto', width: 28, height: 28 }} />
                    <h4 style={{ color: 'var(--neon-lime)', marginBottom: 6 }}>Calculating Preference Matches...</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Evaluating requirements and weighting priorities deterministically.
                    </p>
                  </div>
                )}

                {/* Empty Results with Honest Requirement Explanation */}
                {!loading && movies.length === 0 && (
                  <div className="empty-state-card">
                    <AlertOctagon className="empty-state-icon" />
                    <h3 className="empty-state-title">No Movies Passed Strict Requirements</h3>
                    <p className="empty-state-desc">
                      {meta?.isEmptyBecauseRequiredFailed ? (
                        <>
                          Out of <strong>{meta.totalCandidates}</strong> candidate titles analyzed, none satisfied{' '}
                          <strong style={{ color: 'var(--neon-pink)' }}>ALL {meta.requiredFiltersCount} Required</strong> filters.
                          <br />
                          Da Movies guarantees zero silent requirement relaxation.
                        </>
                      ) : (
                        <>No titles found matching your title search or filter criteria in the current candidate set.</>
                      )}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {meta?.requiredFiltersCount > 0 && (
                        <button
                          type="button"
                          className="btn-primary-action"
                          onClick={relaxRequirements}
                          style={{ background: 'var(--neon-cyan)', boxShadow: 'var(--shadow-glow-cyan)' }}
                        >
                          <RefreshCw size={16} /> Relax Required to Preferred
                        </button>
                      )}
                      <button type="button" className="btn-reset" onClick={handleReset}>
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Movies Grid */}
                {!loading && movies.length > 0 && (
                  <div className="movies-grid">
                    {movies.map((movie) => {
                      const isWishlisted = wishlistItems.some(
                        (w) => String(w.movieId) === String(movie.id)
                      );
                      return (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          onSelectMovie={(m) => setSelectedMovieId(m.id)}
                          onSelectDirector={(dId) => setSelectedDirectorId(dId)}
                          isWishlisted={isWishlisted}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      );
                    })}
                  </div>
                )}
              </main>
            </>
          )}

          {/* Movie Details Modal */}
          {selectedMovieId && (
            <MovieDetailsModal
              movieId={selectedMovieId}
              region={region}
              onClose={() => setSelectedMovieId(null)}
              onSelectDirector={(dId) => {
                setSelectedMovieId(null);
                setSelectedDirectorId(dId);
              }}
            />
          )}

          {/* Director Profile Modal */}
          {selectedDirectorId && (
            <DirectorModal
              directorId={selectedDirectorId}
              onClose={() => setSelectedDirectorId(null)}
              onSelectMovie={(m) => setSelectedMovieId(m.id)}
            />
          )}

          {/* Footer */}
          <Footer />
        </>
      )}
    </div>
  );
}
