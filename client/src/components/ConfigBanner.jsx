import React, { useState } from 'react';
import { Info, X, KeyRound, ExternalLink } from 'lucide-react';

export default function ConfigBanner({ status }) {
  const [dismissed, setDismissed] = useState(false);

  // If TMDB key is already configured or user dismissed banner, don't show
  if (status?.isConfigured || dismissed) return null;

  return (
    <div className="container" style={{ marginTop: '16px' }}>
      <div className="config-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <KeyRound size={20} color="var(--neon-cyan)" style={{ flexShrink: 0 }} />
          <div className="config-banner-text">
            <strong>Running in Demo Mode:</strong> Browsing curated blockbuster catalog with real runtimes, directors, and streaming data.{' '}
            <span>
              To unlock full live TMDB access across 900,000+ films, add your free key to <code>server/.env</code>:
            </span>{' '}
            <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, color: 'var(--neon-lime)' }}>
              TMDB_API_KEY=your_key_here
            </code>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
          title="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
