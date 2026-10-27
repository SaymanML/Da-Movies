import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="logo-badge" style={{ fontSize: '0.85rem', padding: '2px 8px' }}>DA</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>
              MOVIES<span style={{ color: 'var(--neon-pink)' }}>.</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Zero fluff. Exact cinema discovery powered by priority-aware weighting.
          </p>
        </div>

        {/* TMDB Official Attribution */}
        <div className="footer-tmdb-attribution">
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae694f4ef9f0b7950a540c544002ba5a13c4328420e77f9.svg"
            alt="TMDB Logo"
            className="tmdb-logo-img"
          />
          <span>
            This product uses the TMDB API but is not endorsed or certified by TMDB. Movie metadata & imagery courtesy of TMDB and JustWatch.
          </span>
        </div>
      </div>
    </footer>
  );
}
