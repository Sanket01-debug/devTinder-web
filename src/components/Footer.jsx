export default function Footer() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} DevTinder</span>
      <span>Made for people who build.</span>
      <span className="footer-note">Connect. Collaborate. Create.</span>
    </footer>
  );
}
