import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS "Add to Home Screen" ignores icon.svg and only reads apple-icon, so
// the flame needs its own PNG render here (same shape/gradients as
// icon.svg) to show up on mobile the way it already does in desktop tabs.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0c16",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="flameOuter" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF9A3C" />
              <stop offset="55%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#E35D00" />
            </linearGradient>
            <linearGradient id="flameInner" x1="16" y1="11" x2="16" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFC178" />
              <stop offset="100%" stopColor="#FF9A3C" />
            </linearGradient>
          </defs>
          <path
            d="M16 2.5C10.5 9 6.2 14.3 7.3 20.4C8.2 25.4 12 29.5 16 29.5C20 29.5 23.9 25.4 24.7 20.4C25.8 14.3 21.5 9 16 2.5Z"
            fill="url(#flameOuter)"
          />
          <path
            d="M16.2 11.5C13.1 15.5 11.5 18.3 12.3 21.6C12.9 24.1 14.6 26 16.2 26C17.8 26 19.5 24.1 20.1 21.6C20.9 18.3 19.3 15.5 16.2 11.5Z"
            fill="url(#flameInner)"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
