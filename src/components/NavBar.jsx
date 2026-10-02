import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
import { addFeed } from "../utils/feedSlice";
import { addConnections } from "../utils/connectionSlice";
import { addRequests } from "../utils/requestSlice";
import { Avatar } from "./UI";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";
export default function NavBar() {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const logout = async () => {
    try {
      await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
      dispatch(removeUser());
      dispatch(addFeed(null));
      dispatch(addConnections(null));
      dispatch(addRequests(null));
      navigate("/login");
    } catch {
      setError("Could not sign out. Please try again.");
    }
  };
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">&lt;/&gt;</span>devtinder
          <span className="brand-dot">.</span>
        </Link>
        {user ? (
          <>
            <nav className="main-nav" aria-label="Main navigation">
              {[
                ["/", "Discover"],
                ["/connections", "Connections"],
                ["/requests", "Requests"],
              ].map(([to, label]) => (
                <NavLink key={to} to={to} end>
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="nav-account">
              <Link to="/premium" className="premium-link">
                ✦ Go premium
              </Link>
              <ThemeToggle />
              <details className="account-menu">
                <summary aria-label="Account menu">
                  <Avatar user={user} />
                  <span>{user.firstName}</span>
                </summary>
                <div className="account-popover">
                  <Link to="/profile">Edit profile</Link>
                  <Link to="/premium">Membership</Link>
                  <button onClick={logout}>Sign out</button>
                  {error && (
                    <p role="alert" className="error-text">
                      {error}
                    </p>
                  )}
                </div>
              </details>
            </div>
          </>
        ) : (
          <div className="nav-guest">
            <span className="nav-tagline">
              Good connections. Great possibilities.
            </span>
            <ThemeToggle />
          </div>
        )}
      </div>
    </header>
  );
}
