import React from 'react';
import { Globe, ArrowLeft, Heart } from 'lucide-react';

export default function Navbar({
  status,
  region,
  onRegionChange,
  onBack,
  currentView,
  onViewChange,
  wishlistCount = 0
}) {
  return (
    <header className="navbar">
      <div className="container nav-container">
        <div className="logo-wrapper" onClick={() => onViewChange('discovery')} style={{ cursor: 'pointer' }}>
          <span className="logo-badge">DA</span>
          <span className="logo-text">
            MOVIES<span className="logo-dot">.</span>
          </span>
        </div>

        <div className="nav-actions">
          <span className="discovery-message">Less scrolling. Better movies.</span>
          
          <button type="button" className="welcome-link" onClick={onBack} aria-label="Back to welcome page">
            <ArrowLeft size={15} /> <span>Home</span>
          </button>

          {/* Wishlist Nav Button */}
          <button
            type="button"
            className={`nav-wishlist-btn ${currentView === 'wishlist' ? 'active' : ''}`}
            onClick={() => onViewChange(currentView === 'wishlist' ? 'discovery' : 'wishlist')}
            aria-label="View saved wishlist movies"
          >
            <Heart size={15} fill={currentView === 'wishlist' ? 'currentColor' : 'none'} />
            <span>Wishlist</span>
            {wishlistCount > 0 && <span className="nav-wishlist-count">{wishlistCount}</span>}
          </button>

          {/* Region Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={16} color="var(--text-secondary)" />
            <select
              className="region-select"
              value={region}
              onChange={(e) => onRegionChange(e.target.value)}
              title="Streaming Availability Region"
            >
              <option value="IN">India (IN)</option>
              <option value="US">United States (US)</option>
              <option value="GB">United Kingdom (GB)</option>
              <option value="CA">Canada (CA)</option>
              <option value="AU">Australia (AU)</option>
            </select>
          </div>

          {/* TMDB Status indicator */}
          <div className={`status-pill ${status?.isConfigured ? 'configured' : 'demo'}`}>
            <span className="pulse-dot"></span>
            <span>{status?.isConfigured ? 'Live TMDB API' : 'Demo Mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
