import React, { useEffect, useState } from 'react';
import { apiUrl } from '../api';
import {
  X,
  Star,
  Clock,
  Calendar,
  Tv,
  User,
  Film,
  Play,
  Layers
} from 'lucide-react';

export default function MovieDetailsModal({
  movieId,
  region,
  onClose,
  onSelectDirector
}) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/movies/${movieId}?region=${region}`));
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setMovie(data);
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (movieId) {
      fetchDetails();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movieId, region, onClose]);

  if (!movieId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div className="pulse-dot" style={{ margin: '0 auto 16px auto', width: 24, height: 24 }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading movie intelligence...</p>
          </div>
        ) : movie ? (
          <div>
            {/* Backdrop image or fallback */}
            <div style={{ position: 'relative' }}>
              {movie.backdrop_path ? (
                <img
                  src={movie.backdrop_path}
                  alt={movie.title}
                  className="modal-backdrop-img"
                />
              ) : (
                <div className="modal-backdrop-img" style={{ background: '#12121c' }} />
              )}

              {movie.trailerKey && !showTrailer && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(8, 8, 12, 0.85)',
                    border: '2px solid var(--neon-lime)',
                    color: 'var(--neon-lime)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '10px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-glow-lime)'
                  }}
                >
                  <Play size={18} fill="currentColor" /> Watch Official Trailer
                </button>
              )}
            </div>

            {/* Embedded Trailer if clicked */}
            {showTrailer && movie.trailerKey && (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                <iframe
                  title="Official Trailer"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="modal-body">
              {/* Header section with thumbnail poster */}
              <div className="modal-header-section">
                {movie.poster_path && (
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                    className="modal-poster-thumb"
                  />
                )}
                <div className="modal-title-area">
                  <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{movie.title}</h2>

                  {/* Meta row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '14px' }}>
                    {movie.year && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={15} /> {movie.year}
                      </span>
                    )}
                    {movie.runtime && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={15} /> {movie.runtime} mins
                      </span>
                    )}
                    {movie.vote_average && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffc107', fontWeight: 700 }}>
                        <Star size={15} fill="#ffc107" /> {movie.vote_average} / 10
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {movie.genres && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {movie.genres.map((g, i) => (
                        <span key={i} className="mini-genre-pill" style={{ background: 'var(--bg-card-hover)', color: 'var(--neon-cyan)' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Director callout */}
              {movie.director && (
                <div style={{ marginBottom: '20px', padding: '12px 18px', background: 'var(--bg-surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18} color="var(--neon-lime)" />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Directed by</span>
                    <strong style={{ fontSize: '1rem' }}>{movie.director}</strong>
                  </div>
                  {movie.directorId && (
                    <button
                      type="button"
                      className="director-link"
                      onClick={() => onSelectDirector(movie.directorId)}
                      style={{ background: 'transparent', fontSize: '0.85rem' }}
                    >
                      View Director Profile &rarr;
                    </button>
                  )}
                </div>
              )}

              {/* Overview / Synopsis */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--neon-lime)' }}>Overview</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                  {movie.overview}
                </p>
              </div>

              {/* Streaming providers */}
              <div style={{ marginBottom: '28px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tv size={18} color="var(--neon-cyan)" /> Where to Stream ({region})
                </h4>
                {movie.streaming_providers && movie.streaming_providers.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {movie.streaming_providers.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'var(--neon-cyan-dim)',
                          border: '1px solid var(--neon-cyan)',
                          color: 'var(--neon-cyan)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-pill)'
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No flatrate subscription streaming services currently verified for {region}. Check rental options on local digital stores.
                  </p>
                )}
              </div>

              {/* Cast grid */}
              {movie.fullCast && movie.fullCast.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Top Billed Cast</h4>
                  <div className="cast-grid">
                    {movie.fullCast.map((c) => (
                      <div key={c.id} className="cast-card">
                        {c.profile_path ? (
                          <img src={c.profile_path} alt={c.name} className="cast-photo" />
                        ) : (
                          <div className="cast-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="var(--text-muted)" />
                          </div>
                        )}
                        <div className="cast-name">{c.name}</div>
                        <div className="cast-character">{c.character}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Movie details unavailable.
          </div>
        )}
      </div>
    </div>
  );
}
