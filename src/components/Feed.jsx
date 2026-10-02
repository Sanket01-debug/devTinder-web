import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserCard from "./UserCard";
import { EmptyState, Loading, PageHeader } from "./UI";
import { errorMessage } from "../utils/errorMessage";
export default function Feed() {
  const feed = useSelector((store) => store.feed);
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user || feed) return;
    let active = true;
    axios
      .get(BASE_URL + "/feed", { withCredentials: true })
      .then(({ data }) => {
        if (active) dispatch(addFeed(data.data));
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [user, feed, dispatch, retry]);
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="A WORLD OF POSSIBILITIES"
        title="Discover your people."
        description="A new perspective. A shared passion. Your next great connection."
      />
      <div className="discover-layout">
        <aside className="discovery-aside">
          <div className="intro-panel">
            <span className="panel-icon">&lt;/&gt;</span>
            <h2>Better together.</h2>
            <p>
              Behind every great project are people who bring something
              different to the table.
            </p>
            <div className="panel-divider" />
            <p className="eyebrow">MAKE THE FIRST MOVE</p>
            <p>
              See someone interesting? Send a connection request. When they
              accept, the conversation begins.
            </p>
          </div>
          <Link className="profile-tip" to="/profile">
            <span>↗</span>
            <div>
              <strong>Let your profile do the talking</strong>
              <p>A little about you goes a long way.</p>
            </div>
          </Link>
        </aside>
        <div className="discovery-main">
          {error ? (
            <EmptyState title="We couldn’t load your feed." description={error}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setError("");
                  setRetry(retry + 1);
                }}
              >
                Try again
              </button>
            </EmptyState>
          ) : !feed ? (
            <Loading />
          ) : !feed.length ? (
            <EmptyState
              title="You’re all caught up."
              description="You’ve explored everyone in your feed. Check back later for new faces."
            >
              <Link to="/connections" className="btn btn-primary">
                View your connections
              </Link>
            </EmptyState>
          ) : (
            <>
              <UserCard key={feed[0]._id} user={feed[0]} />
              <p className="feed-caption">
                Good connections start with a little curiosity.
              </p>
            </>
          )}
        </div>
        <aside className="discover-note">
          <span className="eyebrow">THE DEVTINDER WAY</span>
          <h3>
            People first.
            <br />
            Possibilities next.
          </h3>
          <p>
            Be curious. Be yourself.
            <br />
            Build something that matters.
          </p>
          <span className="note-art" aria-hidden="true">
            {"{ }"}
          </span>
        </aside>
      </div>
    </div>
  );
}
