import { useState } from "react";
import UserCard from "./UserCard";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { PageHeader } from "./UI";
import { errorMessage } from "../utils/errorMessage";
export default function EditProfile({ user }) {
  const [fields, setFields] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    photoUrl: user.photoUrl || "",
    age: user.age || "",
    gender: user.gender || "",
    about: user.about || "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const update = (name, value) => {
    setFields({ ...fields, [name]: value });
    setSaved(false);
  };
  const save = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      const { data } = await axios.patch(
        BASE_URL + "/profile/edit",
        {
          ...fields,
          age: fields.age === "" ? undefined : Number(fields.age),
          gender: fields.gender || undefined,
          photoUrl: fields.photoUrl || undefined,
        },
        { withCredentials: true },
      );
      dispatch(addUser(data.data));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const field = (name, label, type = "text") => (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={fields[name]}
        required={name === "firstName" || name === "lastName"}
        min={name === "age" ? 18 : undefined}
        max={name === "age" ? 120 : undefined}
        onChange={(event) => update(name, event.target.value)}
      />
    </label>
  );
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="MAKE A GREAT FIRST IMPRESSION"
        title="A little more you."
        description="Give your future connections a glimpse of the person behind the code."
      />
      <div className="profile-layout">
        <form className="surface profile-form" onSubmit={save}>
          <h2>Your details</h2>
          <p className="muted">Make it personal. Make it yours.</p>
          <div className="field-grid">
            {field("firstName", "First name")}
            {field("lastName", "Last name")}
          </div>
          {field("photoUrl", "Profile photo URL", "url")}
          <p className="field-help">
            Use a public image URL for your profile photo.
          </p>
          <div className="field-grid">
            {field("age", "Age", "number")}
            <label className="field">
              <span>Gender</span>
              <select
                value={fields.gender}
                onChange={(event) => update("gender", event.target.value)}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>About you</span>
            <textarea
              rows={5}
              value={fields.about}
              onChange={(event) => update("about", event.target.value)}
              placeholder="What are you building? What gets you curious?"
            />
          </label>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="success-text" role="status">
              ✓ Your profile has been saved.
            </p>
          )}
          <div className="form-bottom">
            <span className="muted">Looking good. Ready to connect?</span>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
        <aside className="profile-preview">
          <p className="eyebrow">HOW OTHERS SEE YOU</p>
          <UserCard user={{ ...user, ...fields }} preview />
        </aside>
      </div>
    </div>
  );
}
