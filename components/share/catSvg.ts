/**
 * A sitting cat, drawn once and reused by both share surfaces: the link
 * preview (rendered on the server, where WebGL isn't available) and the
 * story card composited in the browser.
 */
export const CAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g>
    <path d="M150 150 C182 148 188 116 172 104 C160 95 148 104 152 116"
      fill="none" stroke="#f6ddc4" stroke-width="13" stroke-linecap="round"/>
    <ellipse cx="100" cy="140" rx="46" ry="42" fill="#fff3e2"/>
    <path d="M64 96 L60 58 L92 78 Z" fill="#fff3e2"/>
    <path d="M136 96 L140 58 L108 78 Z" fill="#fff3e2"/>
    <path d="M69 92 L67 70 L86 82 Z" fill="#f4a9bb"/>
    <path d="M131 92 L133 70 L114 82 Z" fill="#f4a9bb"/>
    <circle cx="100" cy="96" r="40" fill="#fff8ee"/>
    <path d="M80 92 q7 -9 14 0" fill="none" stroke="#4a3f5c"
      stroke-width="5" stroke-linecap="round"/>
    <path d="M106 92 q7 -9 14 0" fill="none" stroke="#4a3f5c"
      stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="74" cy="106" rx="9" ry="6" fill="#f9c2ce" opacity="0.85"/>
    <ellipse cx="126" cy="106" rx="9" ry="6" fill="#f9c2ce" opacity="0.85"/>
    <path d="M100 104 l-5 5 h10 z" fill="#e58b9f"/>
    <path d="M100 109 q-7 8 -13 3 M100 109 q7 8 13 3" fill="none"
      stroke="#4a3f5c" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="80" cy="176" rx="15" ry="10" fill="#fff8ee"/>
    <ellipse cx="120" cy="176" rx="15" ry="10" fill="#fff8ee"/>
  </g>
</svg>`;

export const CAT_DATA_URI = `data:image/svg+xml;base64,${
  typeof window === "undefined"
    ? Buffer.from(CAT_SVG).toString("base64")
    : window.btoa(unescape(encodeURIComponent(CAT_SVG)))
}`;
