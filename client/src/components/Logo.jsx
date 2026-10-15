export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CareConnect logo" role="img">
      {/* Shield background */}
      <path d="M24 4L6 12v10c0 11.1 7.68 21.56 18 24 10.32-2.44 18-12.9 18-24V12L24 4z" fill="#1e3a5f" />
      {/* Heart */}
      <path d="M24 33s-8-5.2-8-11.2C16 18.1 19.1 15 22.5 15c1.7 0 3.1.8 3.5 2 .4-1.2 1.8-2 3.5-2C32.9 15 36 18.1 36 21.8 36 27.8 28 33 24 33z" fill="#14b8a6" />
      {/* Chat bubble */}
      <path d="M17 18c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v5c0 1.7-1.3 3-3 3h-3l-3 2.5V26h-2c-1.7 0-3-1.3-3-3v-5z" fill="white" opacity="0.9" />
      {/* Dots in bubble */}
      <circle cx="20.5" cy="20.5" r="1" fill="#1e3a5f" />
      <circle cx="24" cy="20.5" r="1" fill="#1e3a5f" />
      <circle cx="27.5" cy="20.5" r="1" fill="#1e3a5f" />
    </svg>
  );
}
