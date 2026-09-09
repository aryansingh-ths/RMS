/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-on-surface": "#ebf1ff", "on-error": "#ffffff", "secondary-fixed": "#e1e0ff", "tertiary-fixed-dim": "#3cddc7", "on-secondary": "#ffffff", "on-tertiary-fixed-variant": "#005047", "on-surface-variant": "#4f453b", "on-error-container": "#93000a", "on-tertiary-container": "#00443c", "surface-container-highest": "#d5e3fd", "error-container": "#ffdad6", "surface-container-low": "#eff4ff", "tertiary-container": "#00bba8", "secondary-fixed-dim": "#c0c1ff", "surface-container-high": "#dde9ff", "surface-dim": "#ccdbf4", "background": "#f8f9ff", "inverse-primary": "#ebbf8d", "secondary-container": "#6063ee", "surface-container-lowest": "#ffffff", "on-primary-fixed-variant": "#5f411a", "on-primary": "#ffffff", "surface-tint": "#79582f", "primary-fixed-dim": "#ebbf8d", "primary": "#79582f", "surface": "#f8f9ff", "on-primary-fixed": "#2b1700", "primary-container": "#c89f70", "on-secondary-container": "#fffbff", "tertiary-fixed": "#62fae3", "primary-fixed": "#ffddb8", "outline": "#81756a", "outline-variant": "#d3c4b7", "on-primary-container": "#523610", "secondary": "#4648d4", "on-tertiary-fixed": "#00201c", "error": "#ba1a1a", "surface-bright": "#f8f9ff", "surface-variant": "#d5e3fd", "on-background": "#0d1c2f", "surface-container": "#e6eeff", "on-tertiary": "#ffffff", "inverse-surface": "#233144", "on-secondary-fixed": "#07006c", "tertiary": "#006b5f", "on-surface": "#0d1c2f", "on-secondary-fixed-variant": "#2f2ebe"
      },
      borderRadius: {
        "DEFAULT": "1rem", "lg": "2rem", "xl": "3rem", "full": "9999px"
      },
      spacing: {
        "space-xl": "2rem", "space-sm": "0.75rem", "gutter-mobile": "1rem", "space-3xl": "3rem", "space-lg": "1.5rem", "space-md": "1rem", "space-xs": "0.5rem", "gutter-desktop": "2rem", "gutter-tablet": "1.5rem", "space-xxs": "0.25rem", "space-2xl": "2.5rem"
      },
      fontFamily: {
        "headline-lg-mobile": ["Nunito Sans"], "body-lg": ["Nunito Sans"], "label-caps": ["Nunito Sans"], "display-lg": ["Nunito Sans"], "headline-md": ["Nunito Sans"], "headline-lg": ["Nunito Sans"], "label-pill": ["Nunito Sans"], "headline-sm": ["Nunito Sans"], "label-md": ["Nunito Sans"], "body-sm": ["Nunito Sans"], "body-md": ["Nunito Sans"], "title-md": ["Nunito Sans"],
        sans: ['Inter', 'Nunito Sans', 'sans-serif'],
      },
      fontSize: {
        "headline-lg-mobile": ["26px", { "lineHeight": "34px", "letterSpacing": "-0.01em", "fontWeight": "700" }], "body-lg": ["16px", { "lineHeight": "24px", "letterSpacing": "0em", "fontWeight": "500" }], "label-caps": ["11px", { "lineHeight": "16px", "letterSpacing": "0.08em", "fontWeight": "700" }], "display-lg": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "800" }], "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }], "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.015em", "fontWeight": "700" }], "label-pill": ["12px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "700" }], "headline-sm": ["20px", { "lineHeight": "28px", "letterSpacing": "0em", "fontWeight": "600" }], "label-md": ["13px", { "lineHeight": "18px", "letterSpacing": "0.01em", "fontWeight": "600" }], "body-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.01em", "fontWeight": "500" }], "body-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0em", "fontWeight": "400" }], "title-md": ["18px", { "lineHeight": "26px", "letterSpacing": "0em", "fontWeight": "700" }]
      },
      boxShadow: {
        'soft': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
      }
    },
  },
  plugins: [],
}
