export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#14141a", panel: "#1b1b23", raised: "#22222c", line: "#2c2c38", mute: "#9a9aae", violet: "#8b7cf6", azure: "#5b8def" },
    fontFamily: { sans: ["Instrument Sans", "system-ui", "sans-serif"] },
  } },
  plugins: [],
};
