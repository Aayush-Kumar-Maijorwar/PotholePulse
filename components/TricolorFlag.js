// Purely decorative, non-interactive national flag accent for the
// login page. Modest size, gentle sway only — no click behavior.
export default function TricolorFlag() {
  return (
    <svg
      className="tricolor-flag"
      viewBox="0 0 90 60"
      width="54"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="90" height="20" fill="#FF9933" />
      <rect x="0" y="20" width="90" height="20" fill="#FFFFFF" />
      <rect x="0" y="40" width="90" height="20" fill="#138808" />
      <circle cx="45" cy="30" r="8" fill="none" stroke="#0B2E59" strokeWidth="1.1" />
      <circle cx="45" cy="30" r="1.3" fill="#0B2E59" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        return (
          <line
            key={i}
            x1="45"
            y1="30"
            x2="45"
            y2="22.3"
            stroke="#0B2E59"
            strokeWidth="0.6"
            transform={`rotate(${angle} 45 30)`}
          />
        );
      })}
    </svg>
  );
}
