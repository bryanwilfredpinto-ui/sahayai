// components/Card.jsx
// -------------------
// Reusable card shell. Every card has a 🔊 speaker placeholder
// (will be wired to voice synthesis in Phase 5).

export default function Card({
  title,
  subtitle,
  trailing,
  children,
  className = '',
  showSpeaker = true,
  onSpeak,
}) {
  return (
    <div className={`card card-hover animate-fade-up ${className}`}>
      {(title || subtitle || trailing || showSpeaker) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-text truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {trailing}
            {showSpeaker && (
              <button
                aria-label="Speak card content"
                onClick={onSpeak}
                className="grid size-8 place-items-center rounded-full border border-border-soft text-muted hover:text-accent hover:border-accent/50 transition-colors"
              >
                <SpeakerIcon />
              </button>
            )}
          </div>
        </header>
      )}
      {children}
    </div>
  )
}

function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 010 7" />
      <path d="M19 5a9 9 0 010 14" />
    </svg>
  )
}
