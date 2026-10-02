export default function Seal({ size = 40, color = '#FFFFFF', className = 'seal' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="30" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="32" cy="32" r="24" fill="none" stroke={color} strokeWidth="1" />
      <path
        d="M32 14 L36 26 L49 26 L38.5 33 L42.5 45 L32 37.5 L21.5 45 L25.5 33 L15 26 L28 26 Z"
        fill={color}
      />
    </svg>
  );
}
