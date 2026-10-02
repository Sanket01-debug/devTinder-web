// Apply the theme before the page renders to avoid a bright flash on reload.
(() => {
  let preference;
  try {
    preference = localStorage.getItem("devtinder-theme");
  } catch {
    // The system preference still works when browser storage is unavailable.
  }
  const theme =
    preference === "light" || preference === "dark"
      ? preference
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#111b16" : "#176b50");
})();
