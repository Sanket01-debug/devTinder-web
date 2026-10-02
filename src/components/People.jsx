import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { addConnections } from "../utils/connectionSlice";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { Avatar, EmptyState, Loading, PageHeader } from "./UI";
import { errorMessage } from "../utils/errorMessage";
export default function People({ requests = false }) {
  const items = useSelector((store) =>
    requests ? store.requests : store.connections,
  );
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return;
    let active = true;
    axios
      .get(
        BASE_URL + (requests ? "/user/requests/received" : "/user/connections"),
        { withCredentials: true },
      )
      .then(({ data }) => {
        if (active)
          dispatch(
            requests ? addRequests(data.data) : addConnections(data.data),
          );
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [user, requests, dispatch, retry]);
  const review = async (status, id) => {
    setBusy(id);
    setError("");
    try {
      await axios.post(
        `${BASE_URL}/request/review/${status}/${id}`,
        {},
        { withCredentials: true },
      );
      dispatch(removeRequest(id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="page-container">
      <PageHeader
        eyebrow={requests ? "OPEN THE DOOR TO SOMETHING NEW" : "YOUR COMMUNITY"}
        title={
          requests
            ? "Someone wants to say hello."
            : "Good people. In your corner."
        }
        description={
          requests
            ? "Meet the developers who would like to connect with you."
            : "Keep the conversation going. Your next idea could start here."
        }
      >
        {items && (
          <span className="count-pill">
            {items.length} {requests ? "requests" : "connections"}
          </span>
        )}
      </PageHeader>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button
            onClick={() => {
              setError("");
              setRetry(retry + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {!items ? (
        error ? null : (
          <Loading />
        )
      ) : !items.length ? (
        <EmptyState
          title={
            requests
              ? "Your inbox is all clear."
              : "Your community starts here."
          }
          description={
            requests
              ? "New connection requests will appear here. Discover some people in the meantime."
              : "Explore the community and send a request. Accepted connections will appear here."
          }
        >
          <Link to="/" className="btn btn-primary">
            Discover developers →
          </Link>
        </EmptyState>
      ) : (
        <div className="people-grid">
          {items.map((item) => {
            const person = requests ? item.fromUserId : item;
            return (
              <article className="person-card" key={item._id}>
                <div className="person-top">
                  <Avatar user={person} />
                  <span className="person-kind">
                    {requests ? "Wants to connect" : "Your connection"}
                  </span>
                </div>
                <h2>
                  {person.firstName} {person.lastName}
                </h2>
                <p className="muted">
                  {[person.age && `${person.age} years old`, person.gender]
                    .filter(Boolean)
                    .join(" · ") || "Developer community"}
                </p>
                <p className="person-about">
                  {person.about || "Get to know the person behind the profile."}
                </p>
                <div className="skill-list">
                  {person.skills?.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <div className="card-buttons">
                  {requests ? (
                    <>
                      <button
                        className="btn btn-outline"
                        disabled={busy !== null}
                        onClick={() => review("rejected", item._id)}
                      >
                        Decline
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={busy !== null}
                        onClick={() => review("accepted", item._id)}
                      >
                        {busy === item._id ? "Please wait…" : "Accept request"}
                      </button>
                    </>
                  ) : (
                    <Link
                      className="btn btn-primary full-width"
                      to={`/chat/${person._id}`}
                      state={{ person }}
                    >
                      Start a conversation ↗
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
