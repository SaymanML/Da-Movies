import React, { useState } from 'react';
import {
  Star,
  Clock,
  Calendar,
  Tv,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Film,
  Heart
} from 'lucide-react';

export default function MovieCard({
  movie,
  onSelectMovie,
  onSelectDirector,
  isWishlisted = false,
  onToggleWishlist
}) {
  const [showWhy, setShowWhy] = useState(false);

  const breakdown = movie.breakdown || {};
  const matched = breakdown.matchedPreferences || [];
  const missed = breakdown.missedPreferences || [];
  const unknown = breakdown.unknownPreferences || [];
  const required = breakdown.requiredSatisfied || [];

  return (
    <article className="movie-card">
      {/* Poster area */}
      <div className="movie-poster-wrap" onClick={() => onSelectMovie(movie)}>
        {movie.poster_path ? (
          <img
            src={movie.poster_path}
            alt={movie.title}
            className="movie-poster-img"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="poster-fallback" style={{ display: movie.poster_path ? 'none' : 'flex' }}>
          <Film size={36} color="var(--text-muted)" />
          <span>{movie.title}</span>
        </div>

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            type="button"
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(movie);
            }}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Da Score Badge (when calculated by recommendation engine) */}
        {movie.daScore !== undefined && (
          <div className="da-score-badge" title="Da Movies Match Score based on your criteria">
            <span>{movie.daScore}%</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="movie-card-content">
        <h3 className="movie-card-title" onClick={() => onSelectMovie(movie)}>
          {movie.title}
        </h3>

        {/* Meta row */}
        <div className="movie-meta-row">
          {movie.year && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> {movie.year}
            </span>
          )}

          {movie.runtime ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} /> {movie.runtime}m
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Runtime N/A</span>
          )}

          {movie.vote_average ? (
            <span className="rating-pill">
              <Star size={13} fill="#ffc107" color="#ffc107" />
              {movie.vote_average}
              {movie.vote_count > 0 && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({movie.vote_count > 1000 ? `${(movie.vote_count / 1000).toFixed(1)}k` : movie.vote_count})
                </span>
              )}
            </span>
          ) : null}
        </div>

        {/* Genres */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="movie-genres-list">
            {movie.genres.slice(0, 3).map((g, i) => (
              <span key={i} className="mini-genre-pill">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Streaming availability */}
        {movie.streaming_providers && movie.streaming_providers.length > 0 ? (
          <div className="movie-streaming-badge">
            <Tv size={13} />
            <span>Watch on {movie.streaming_providers.slice(0, 2).join(', ')}</span>
          </div>
        ) : (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Streaming data not listed
          </div>
        )}

        {/* "Why This Movie?" Accordion (shown if recommendation breakdown exists) */}
        {movie.breakdown && (
          <div className="why-movie-accordion">
            <button
              type="button"
              className="why-movie-trigger"
              onClick={() => setShowWhy(!showWhy)}
            >
              <span>Why This Movie? ({matched.length} matches)</span>
              {showWhy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showWhy && (
              <div className="why-movie-details">
                {/* Strict requirements passed */}
                {required.length > 0 && (
                  <div style={{ marginBottom: 4, color: 'var(--neon-pink)', fontWeight: 600 }}>
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Strictly satisfied: {required.join(', ')}
                  </div>
                )}

                {/* Matched preferences */}
                {matched.length > 0 ? (
                  matched.map((m, idx) => (
                    <div key={idx} className="match-item positive">
                      <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>
                        Matched <strong>{m.label}</strong> (+{m.score}%)
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>No active preference filters tested.</div>
                )}

                {/* Missed preferences */}
                {missed.map((m, idx) => (
                  <div key={idx} className="match-item negative">
                    <XCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Missed {m.label} ({m.score}%)
                    </span>
                  </div>
                ))}

                {/* Unknown preferences */}
                {unknown.map((u, idx) => (
                  <div key={idx} className="match-item unknown">
                    <HelpCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{u.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
