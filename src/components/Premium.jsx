import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { EmptyState, Loading, PageHeader } from "./UI";
import { errorMessage } from "../utils/errorMessage";
export default function Premium() {
  const [premium, setPremium] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    axios
      .get(BASE_URL + "/premium/verify", { withCredentials: true })
      .then(({ data }) => {
        if (active) setPremium(!!data.isPremium);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const buy = async (type) => {
    setError("");
    setBusy(type);
    try {
      if (!window.Razorpay)
        throw new Error(
          "Payment service is unavailable. Refresh the page and try again.",
        );
      const { data } = await axios.post(
        BASE_URL + "/payment/create",
        { membershipType: type },
        { withCredentials: true },
      );
      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "DevTinder",
        description: type + " membership",
        order_id: data.orderId,
        prefill: {
          name: data.notes.firstName + " " + data.notes.lastName,
          email: data.notes.emailId,
        },
        theme: { color: "#176b50" },
        handler: async () => {
          try {
            const { data: status } = await axios.get(
              BASE_URL + "/premium/verify",
              { withCredentials: true },
            );
            setPremium(!!status.isPremium);
            if (!status.isPremium)
              setError(
                "Payment received. Membership activation may take a moment. Refresh to check your status.",
              );
          } catch (err) {
            setError(errorMessage(err));
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      checkout.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setBusy(null);
      });
      checkout.open();
    } catch (err) {
      setError(err.response ? errorMessage(err) : err.message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="page-container premium-page">
      <PageHeader
        eyebrow="MORE ROOM FOR POSSIBILITY"
        title="Invest in your next chapter."
        description="Make more connections and keep meaningful conversations going."
      />
      {error && (
        <div className="error-banner" role="alert">
          {error}
          {premium === null && (
            <button
              onClick={() => {
                setError("");
                setRetry(retry + 1);
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}
      {premium === null ? (
        error ? null : (
          <Loading />
        )
      ) : premium ? (
        <EmptyState
          title="You’re part of something special."
          description="Your premium membership is active. Explore the community and make your next connection."
        />
      ) : (
        <div className="plans-grid">
          {[
            {
              type: "silver",
              name: "Silver",
              duration: "3 months",
              limit: "100 connection requests per day",
              subtitle: "A little more room to explore.",
            },
            {
              type: "gold",
              name: "Gold",
              duration: "6 months",
              limit: "Unlimited connection requests",
              subtitle: "Go all in on your next big possibility.",
            },
          ].map((plan) => (
            <article className={`plan-card ${plan.type}`} key={plan.type}>
              <div className="plan-top">
                <span className="plan-symbol">✦</span>
                <span className="count-pill">{plan.duration}</span>
              </div>
              <h2>{plan.name}</h2>
              <p className="muted">{plan.subtitle}</p>
              <div className="panel-divider" />
              <ul>
                {[
                  "Chat with other developers",
                  plan.limit,
                  "Premium profile badge",
                  plan.duration + " of membership",
                ].map((feature) => (
                  <li key={feature}>
                    <span>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`btn ${plan.type === "gold" ? "btn-primary" : "btn-outline"} full-width`}
                disabled={busy !== null}
                onClick={() => buy(plan.type)}
              >
                {busy === plan.type
                  ? "Opening checkout…"
                  : "Choose " + plan.name + " →"}
              </button>
              <p className="plan-note">
                View the price in secure checkout before paying.
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
