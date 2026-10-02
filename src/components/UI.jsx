import { useState } from "react";

export function Avatar({ user, className = "" }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const showPhoto = user?.photoUrl && user.photoUrl !== failedUrl;

  return (
    <div className={`avatar-photo ${className}`}>
      <span>
        {user?.firstName?.[0] || "D"}
        {user?.lastName?.[0] || ""}
      </span>
      {showPhoto && (
        <img
          src={user.photoUrl}
          alt={`${user.firstName || "Developer"}'s profile`}
          onError={() => setFailedUrl(user.photoUrl)}
        />
      )}
    </div>
  );
}
export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </header>
  );
}
export function EmptyState({ title, description, children }) {
  return (
    <div className="empty-state">
      <div className="empty-symbol" aria-hidden="true">
        &lt;/&gt;
      </div>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <span className="loading loading-spinner" /> Getting things ready…
    </div>
  );
}
