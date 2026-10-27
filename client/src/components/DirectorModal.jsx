import React, { useEffect, useState } from 'react';
import { apiUrl } from '../api';
import { X, Film, Calendar, MapPin, User } from 'lucide-react';

export default function DirectorModal({ directorId, onClose, onSelectMovie }) {
  const [director, setDirector] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDirector() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/director/${directorId}`));
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setDirector(data);
        }
      } catch (err) {
        console.error('Failed to load director profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (directorId) {
      fetchDirector();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [directorId, onClose]);

  if (!directorId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ padding: '70px 20px', textAlign: 'center' }}>
            <div className="pulse-dot" style={{ margin: '0 auto 16px auto', width: 22, height: 22 }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading director profile...</p>
          </div>
        ) : director ? (
          <div style={{ padding: '32px' }}>
            {/* Profile Header */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
              {director.profile_path ? (
                <img
                  src={director.profile_path}
                  alt={director.name}
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neon-cyan)' }}
                />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={36} color="var(--text-muted)" />
                </div>
              )}

              <div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{director.name}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {director.birthday && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} /> Born {director.birthday}
                    </span>
                  )}
                  {director.place_of_birth && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} /> {director.place_of_birth}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Biography */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--neon-lime)' }}>Biography</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', maxHeight: '160px', overflowY: 'auto' }}>
                {director.biography || 'No biography available.'}
              </p>
            </div>

            {/* Filmography */}
            {director.movies && director.movies.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Film size={16} color="var(--neon-pink)" /> Key Directed Feature Films
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                  {director.movies.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        onClose();
                        onSelectMovie({ id: m.id });
                      }}
                      style={{
                        background: 'var(--bg-surface)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border-subtle)',
                        transition: 'transform 0.15s ease'
                      }}
                      title={m.title}
                    >
                      {m.poster_path ? (
                        <img src={m.poster_path} alt={m.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: '120px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Film size={20} color="var(--text-muted)" />
                        </div>
                      )}
                      <div style={{ padding: '6px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
