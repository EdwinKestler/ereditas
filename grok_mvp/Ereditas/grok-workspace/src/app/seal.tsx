export function Seal({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="37" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <path
        d="M40 52 V28 M40 36 C33 32 28 28 26 22 M40 34 C47 30 53 26 55 20 M40 40 C32 38 26 36 22 32 M40 42 C49 39 55 36 60 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M28 54 C32 48 36 50 40 52 C44 50 48 48 52 54"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="26" cy="21" r="1.4" fill="currentColor" />
      <circle cx="56" cy="19" r="1.4" fill="currentColor" />
    </svg>
  );
}
