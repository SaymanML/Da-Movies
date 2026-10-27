import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../api';
import {
  Search,
  RotateCcw,
  Sparkles,
  Clock,
  Star,
  Calendar,
  Layers,
  User,
  Tv,
  Lock,
  Heart,
  Ban,
  Check
} from 'lucide-react';

const COMMON_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
  'Thriller', 'War'
];

const STREAMING_PROVIDERS = [
  'Netflix',
  'Prime Video',
  'Disney+ Hotstar',
  'JioCinema',
  'Apple TV',
  'SonyLIV',
  'Max'
];

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  onSubmit,
  loading
}) {
  // Autocomplete state for director
  const [dirQuery, setDirQuery] = useState('');
  const [dirResults, setDirResults] = useState([]);
  const [showDirDrop, setShowDirDrop] = useState(false);

  useEffect(() => {
    if (!dirQuery.trim()) {
      setDirResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/search/person?query=${encodeURIComponent(dirQuery)}`));
        if (res.ok) {
          const data = await res.json();
          setDirResults(data);
          setShowDirDrop(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [dirQuery]);

  const updateFilter = (category, field, value) => {
    onChange({
      ...filters,
      [category]: {
        ...filters[category],
        [field]: value
      }
    });
  };

  const handleModeChange = (category, mode) => {
    onChange({
      ...filters,
      [category]: {
        ...filters[category],
        mode
      }
    });
  };

  const toggleGenre = (genre) => {
    const current = filters.genre?.genres || [];
    const exists = current.includes(genre);
    const updated = exists ? current.filter(g => g !== genre) : [...current, genre];
    updateFilter('genre', 'genres', updated);
  };

  const selectProvider = (prov) => {
    const current = filters.streaming?.providerName;
    updateFilter('streaming', 'providerName', current === prov ? '' : prov);
  };

  // Helper component for Mode Switch
  const renderModeControls = (category) => {
    const mode = filters[category]?.mode || 'OFF';
    return (
      <div className="mode-switch-group">
        <button
          type="button"
          className={`mode-btn ${mode === 'OFF' ? 'active off' : ''}`}
          onClick={() => handleModeChange(category, 'OFF')}
          title="Ignore this filter entirely"
        >
          <Ban size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
          OFF
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'REQUIRED' ? 'active required' : ''}`}
          onClick={() => handleModeChange(category, 'REQUIRED')}
          title="Movie MUST strictly meet this condition (excludes violations)"
        >
          <Lock size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
          REQUIRED
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'PREFERRED' ? 'active preferred' : ''}`}
          onClick={() => handleModeChange(category, 'PREFERRED')}
          title="Boosts ranking if satisfied, never excludes movies"
        >
          <Heart size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
          PREFERRED
        </button>
      </div>
    );
  };

  return (
    <div className="filter-panel-card">
      {/* Search Header Bar */}
      <div className="filter-header-bar">
        <div className="filter-search-box">
          <Search className="filter-search-icon" size={18} />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search movie title (e.g. Interstellar, Inception, Dune)..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="filters-grid">
        {/* 1. RUNTIME */}
        <div className={`filter-item-card mode-${filters.runtime?.mode?.toLowerCase() || 'off'}`}>
          <div className="filter-card-header">
            <span className="filter-card-title">
              <Clock size={16} color="var(--neon-cyan)" /> Runtime / Duration
            </span>
            {renderModeControls('runtime')}
          </div>
          <div className="numeric-controls">
            <select
              className="operator-select"
              value={filters.runtime?.operator || '<='}
              onChange={(e) => updateFilter('runtime', 'operator', e.target.value)}
            >
              <option value="<=">&le; At most</option>
              <option value=">=">&ge; At least</option>
              <option value="between">Between</option>
            </select>
            <input
              type="number"
              className="numeric-input"
              value={filters.runtime?.value || 120}
              onChange={(e) => updateFilter('runtime', 'value', Number(e.target.value))}
              placeholder="Minutes"
              min="30"
              max="300"
            />
            {filters.runtime?.operator === 'between' && (
              <input
                type="number"
                className="numeric-input"
                value={filters.runtime?.valueMax || 150}
                onChange={(e) => updateFilter('runtime', 'valueMax', Number(e.target.value))}
                placeholder="Max min"
                min="30"
                max="300"
              />
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>min</span>
          </div>
        </div>

        {/* 2. RATING */}
        <div className={`filter-item-card mode-${filters.rating?.mode?.toLowerCase() || 'off'}`}>
          <div className="filter-card-header">
            <span className="filter-card-title">
              <Star size={16} color="#ffc107" /> Minimum Rating
            </span>
            {renderModeControls('rating')}
          </div>
          <div className="numeric-controls">
            <select
              className="operator-select"
              value={filters.rating?.operator || '>='}
              onChange={(e) => updateFilter('rating', 'operator', e.target.value)}
            >
              <option value=">=">&ge; At least</option>
              <option value="<=">&le; At most</option>
              <option value="between">Between</option>
            </select>
            <input
              type="number"
              step="0.1"
              className="numeric-input"
              value={filters.rating?.value ?? 7.5}
              onChange={(e) => updateFilter('rating', 'value', parseFloat(e.target.value))}
              placeholder="0.0 - 10.0"
              min="1.0"
              max="10.0"
            />
            {filters.rating?.operator === 'between' && (
              <input
                type="number"
                step="0.1"
                className="numeric-input"
                value={filters.rating?.valueMax ?? 9.5}
                onChange={(e) => updateFilter('rating', 'valueMax', parseFloat(e.target.value))}
                placeholder="Max"
                min="1.0"
                max="10.0"
              />
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 10</span>
          </div>
        </div>

        {/* 3. RELEASE YEAR */}
        <div className={`filter-item-card mode-${filters.year?.mode?.toLowerCase() || 'off'}`}>
          <div className="filter-card-header">
            <span className="filter-card-title">
              <Calendar size={16} color="var(--neon-pink)" /> Release Year
            </span>
            {renderModeControls('year')}
          </div>
          <div className="numeric-controls">
            <select
              className="operator-select"
              value={filters.year?.operator || '>='}
              onChange={(e) => updateFilter('year', 'operator', e.target.value)}
            >
              <option value=">=">&ge; Released after</option>
              <option value="<=">&le; Released before</option>
              <option value="between">Between</option>
            </select>
            <input
              type="number"
              className="numeric-input"
              value={filters.year?.value || 2015}
              onChange={(e) => updateFilter('year', 'value', Number(e.target.value))}
              placeholder="Year (e.g. 2015)"
              min="1950"
              max="2030"
            />
            {filters.year?.operator === 'between' && (
              <input
                type="number"
                className="numeric-input"
                value={filters.year?.valueMax || 2024}
                onChange={(e) => updateFilter('year', 'valueMax', Number(e.target.value))}
                placeholder="End Year"
                min="1950"
                max="2030"
              />
            )}
          </div>
        </div>

        {/* 4. GENRE */}
        <div className={`filter-item-card mode-${filters.genre?.mode?.toLowerCase() || 'off'}`}>
          <div className="filter-card-header">
            <span className="filter-card-title">
              <Layers size={16} color="var(--neon-lime)" /> Genre Selection
            </span>
            {renderModeControls('genre')}
          </div>
          <div className="genre-pills-wrap">
            {COMMON_GENRES.map((g) => {
              const isSelected = (filters.genre?.genres || []).includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  className={`genre-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleGenre(g)}
                >
                  {isSelected && <Check size={11} style={{ display: 'inline', marginRight: 3 }} />}
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. DIRECTOR */}
        <div className={`filter-item-card mode-${filters.director?.mode?.toLowerCase() || 'off'}`}>
          <div className="filter-card-header">
            <span className="filter-card-title">
              <User size={16} color="var(--neon-cyan)" /> Director
            </span>
            {renderModeControls('director')}
          </div>
          <div className="person-autocomplete-wrap">
            <input
              type="text"
              className="numeric-input"
              placeholder="Type director name (e.g. Christopher Nolan, Denis Villeneuve)..."
              value={filters.director?.personName || ''}
              onChange={(e) => {
                updateFilter('director', 'personName', e.target.value);
                setDirQuery(e.target.value);
              }}
              onFocus={() => dirResults.length > 0 && setShowDirDrop(true)}
            />
            {showDirDrop && dirResults.length > 0 && (
              <div className="autocomplete-dropdown">
                {dirResults.map((person) => (
                  <div
                    key={person.id}
                    className="autocomplete-item"
                    onClick={() => {
                      updateFilter('director', 'personName', person.name);
                      updateFilter('director', 'personId', person.id);
                      setShowDirDrop(false);
                    }}
                  >
                    {person.profile_path && (
                      <img src={person.profile_path} alt={person.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    )}
                    <span>{person.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>



        {/* 7. STREAMING PLATFORM */}
        <div className={`filter-item-card mode-${filters.streaming?.mode?.toLowerCase() || 'off'}`}>
          <div className="filter-card-header">
            <span className="filter-card-title">
              <Tv size={16} color="var(--neon-lime)" /> Streaming Platform
            </span>
            {renderModeControls('streaming')}
          </div>
          <div className="provider-pills-wrap">
            {STREAMING_PROVIDERS.map((prov) => {
              const isSelected = filters.streaming?.providerName === prov;
              return (
                <button
                  type="button"
                  key={prov}
                  className={`provider-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectProvider(prov)}
                >
                  {isSelected && <Check size={11} style={{ display: 'inline', marginRight: 3 }} />}
                  {prov}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button
          type="button"
          className="btn-reset"
          onClick={onReset}
          title="Reset all filters to defaults"
        >
          <RotateCcw size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
          Reset All Filters
        </button>

        <button
          type="button"
          className="btn-primary-action"
          onClick={onSubmit}
          disabled={loading}
        >
          <Sparkles size={18} />
          {loading ? 'Crunching Match Engine...' : 'Find My Movies'}
        </button>
      </div>
    </div>
  );
}
