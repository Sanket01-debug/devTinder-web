import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { errorMessage } from "../utils/errorMessage";
export default function Login() {
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    emailId: "",
    password: "",
  });
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await axios.post(
        BASE_URL + (isLogin ? "/login" : "/signup"),
        isLogin
          ? { emailId: fields.emailId, password: fields.password }
          : fields,
        { withCredentials: true },
      );
      dispatch(addUser(isLogin ? data : data.data));
      navigate(isLogin ? "/" : "/profile");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const field = (name, label, type = "text", placeholder = "") => (
    <label className="field">
      <span>{label}</span>
      <input
        required
        type={type}
        autoComplete={
          name === "password"
            ? isLogin
              ? "current-password"
              : "new-password"
            : name === "emailId"
              ? "email"
              : name === "firstName"
                ? "given-name"
                : "family-name"
        }
        value={fields[name]}
        placeholder={placeholder}
        onChange={(event) =>
          setFields({ ...fields, [name]: event.target.value })
        }
      />
    </label>
  );
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS WITH A CONNECTION</p>
        <h1>
          Find your people.
          <br />
          Build something <span>great.</span>
        </h1>
        <p className="story-description">
          Meet developers who share your curiosity. Find a collaborator, a fresh
          perspective, or your next big idea.
        </p>
        <div className="code-window">
          <div className="window-bar">
            <i />
            <i />
            <i />
            <span>possibilities.js</span>
          </div>
          <pre>
            <span className="code-comment">
              // Great things start with a hello
            </span>
            {"\n"}
            <span className="code-purple">const</span>
            {" connection = {\n  curiosity: "}
            <span className="code-green">"endless"</span>
            {",\n  ideas: "}
            <span className="code-green">"better together"</span>
            {",\n  nextChapter: "}
            <span className="code-green">"yours to build"</span>
            {"\n};"}
          </pre>
          <div className="code-bottom">
            <span className="status-dot" /> Ready to connect
          </div>
        </div>
        <div className="story-bottom">
          <span>&lt;/&gt;</span>
          <p>
            A little less scrolling.
            <br />
            <strong>A lot more possibility.</strong>
          </p>
        </div>
      </section>
      <section className="auth-card">
        <p className="eyebrow">WELCOME TO DEVTINDER</p>
        <h2>
          {isLogin ? "Good to see you again." : "Let’s get you connected."}
        </h2>
        <p className="muted">
          {isLogin
            ? "Sign in to find your next great connection."
            : "Create your account and meet your community."}
        </p>
        <form onSubmit={submit}>
          {!isLogin && (
            <div className="field-grid">
              {field("firstName", "First name")}
              {field("lastName", "Last name")}
            </div>
          )}
          {field("emailId", "Email address", "email", "you@example.com")}
          {field("password", "Password", "password", "Enter your password")}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary full-width" disabled={busy}>
            {busy ? "Please wait…" : isLogin ? "Sign in →" : "Create account →"}
          </button>
        </form>
        <div className="auth-switch">
          {isLogin ? "New around here?" : "Already have an account?"}{" "}
          <button
            disabled={busy}
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Join the community" : "Sign in"}
          </button>
        </div>
        <p className="auth-note">
          Your next meaningful connection is one hello away.
        </p>
      </section>
    </div>
  );
}
