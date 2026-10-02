import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useEffect, useState } from "react";
import { EmptyState, Loading } from "./UI";
export default function Body() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((store) => store.user);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (user) return;
    let active = true;
    axios
      .get(BASE_URL + "/profile/view", { withCredentials: true })
      .then(({ data }) => {
        if (active) dispatch(addUser(data));
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) navigate("/login", { replace: true });
        else setError("We couldn’t reach the server. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [user, dispatch, navigate, retry]);
  const publicPage = location.pathname === "/login";
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        {user || publicPage ? (
          <Outlet />
        ) : error ? (
          <div className="page-container">
            <EmptyState title="Let’s try that again." description={error}>
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
          </div>
        ) : (
          <Loading />
        )}
      </main>
      <Footer />
    </div>
  );
}
