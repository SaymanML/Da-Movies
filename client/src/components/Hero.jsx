import React from 'react';
import { Flame, Sparkles } from 'lucide-react';

export default function Hero({ onApplyPreset }) {
  const presets = [
    {
      label: '⚡ Sub-90m Quickies',
      desc: 'Runtime <= 90 mins (Required)',
      filter: {
        runtime: { mode: 'REQUIRED', operator: '<=', value: 90 }
      }
    },
    {
      label: '⭐ Elite 8.0+ Rated',
      desc: 'Rating >= 8.0 (Required)',
      filter: {
        rating: { mode: 'REQUIRED', operator: '>=', value: 8.0 }
      }
    },
    {
      label: '🍿 Sci-Fi Masterpieces',
      desc: 'Sci-Fi (Required) + High Rating (Preferred)',
      filter: {
        genre: { mode: 'REQUIRED', genres: ['Science Fiction'], matchAll: false },
        rating: { mode: 'PREFERRED', operator: '>=', value: 8.0 }
      }
    },
    {
      label: '🎬 Nolan Epics',
      desc: 'Director: Christopher Nolan',
      filter: {
        director: { mode: 'REQUIRED', personName: 'Christopher Nolan' }
      }
    },
    {
      label: '👻 Horror Night on Netflix',
      desc: 'Horror (Required) + Netflix (Preferred)',
      filter: {
        genre: { mode: 'REQUIRED', genres: ['Horror'] },
        streaming: { mode: 'PREFERRED', providerName: 'Netflix' }
      }
    }
  ];

  return (
    <section className="hero-section">
      <div className="container">
        <div className="discovery-intro">
          <span className="hero-tagline-badge"><Sparkles size={14} /> Your next movie starts here</span>
          <h1 className="hero-title">Find your next <span className="highlight-lime">favorite.</span></h1>
        </div>

        {/* Quick Presets */}
        <div className="presets-container">
          <span className="preset-label">
            <Flame size={14} color="var(--neon-pink)" /> Quick picks
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              className="preset-chip"
              onClick={() => onApplyPreset(p.filter)}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
