import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removeUserFromFeed } from "../utils/feedSlice";
import { useState } from "react";
import { Avatar } from "./UI";
import { errorMessage } from "../utils/errorMessage";
export default function UserCard({ user, preview = false }) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = async (status) => {
    setBusy(true);
    setError("");
    try {
      await axios.post(
        `${BASE_URL}/request/send/${status}/${user._id}`,
        {},
        { withCredentials: true },
      );
      dispatch(removeUserFromFeed(user._id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="developer-card">
      <div className="profile-visual">
        <Avatar key={user.photoUrl} user={user} />
        <span className="profile-label">
          {preview ? "Your profile preview" : "Discover a new connection"}
        </span>
      </div>
      <div className="developer-body">
        <div className="developer-title">
          <h2>
            {user.firstName || "Your name"} {user.lastName}
          </h2>
          {user.isPremium && (
            <span className="verified" title="Premium member">
              ✓
            </span>
          )}
        </div>
        <p className="muted profile-meta">
          {[user.age && `${user.age} years old`, user.gender]
            .filter(Boolean)
            .join(" · ") || "Part of the developer community"}
        </p>
        <p className="developer-about">
          {user.about ||
            "A new connection and a world of possibilities. Say hello and get to know each other."}
        </p>
        {user.skills?.length > 0 && (
          <div className="skill-list">
            {user.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {!preview && (
          <div className="card-buttons">
            <button
              className="btn btn-outline"
              disabled={busy}
              onClick={() => request("ignored")}
            >
              × &nbsp; Pass
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => request("interested")}
            >
              + &nbsp; Connect
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
