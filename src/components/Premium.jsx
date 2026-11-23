import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { EmptyState, Loading, PageHeader } from "./UI";
import { errorMessage } from "../utils/errorMessage";
import "./premium.css";
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
        eyebrow="YOUR NEXT CONNECTION STARTS HERE"
        title="More possibilities. Your pace."
        description="Choose a little extra room to grow your developer network."
      />
      <section className="premium-video-banner" aria-labelledby="premium-video-title">
        <span className="premium-camera-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-3v10l-6-3" /></svg>
        </span>
        <div>
          <span className="premium-free-label">FREE FOR EVERY MEMBER</span>
          <h2 id="premium-video-title">Unlimited video calls. For everyone.</h2>
          <p>Start or answer as many calls as you like with your accepted connections. No premium membership needed.</p>
        </div>
      </section>
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
              subtitle: "Room to meet your next collaborator.",
              price: "300",
              label: "A fresh start",
            },
            {
              type: "gold",
              name: "Gold",
              duration: "6 months",
              limit: "Unlimited connection requests",
              subtitle: "More time to build lasting connections.",
              price: "700",
              label: "The longer view",
            },
          ].map((plan) => (
            <article className={`membership-card membership-${plan.type}`} key={plan.type}>
              <div className="membership-card-top">
                <span className="membership-emblem" aria-hidden="true">{plan.type === "gold" ? "✦" : "◇"}</span>
                <span className="membership-label">{plan.label}</span>
              </div>
              <h2>{plan.name}</h2>
              <p className="membership-subtitle">{plan.subtitle}</p>
              <div className="membership-price"><span>₹{plan.price}</span><span>/ {plan.duration}</span></div>
              <p className="membership-price-note">One membership. More ways to connect.</p>
              <div className="membership-divider" />
              <p className="membership-includes">YOUR MEMBERSHIP INCLUDES</p>
              <ul>
                {[
                  plan.limit,
                  "Premium profile badge",
                  plan.duration + " of membership",
                ].map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="membership-shared"><span aria-hidden="true">∞</span><div>Unlimited chat &amp; video calls<small>Always available on free accounts, too.</small></div></div>
              <button
                className={`btn ${plan.type === "gold" ? "btn-primary" : "btn-outline"} full-width membership-choose`}
                disabled={busy !== null}
                onClick={() => buy(plan.type)}
              >
                {busy === plan.type
                  ? "Opening checkout…"
                  : "Choose " + plan.name + " →"}
              </button>
              <p className="membership-checkout-note">
                Secure checkout with Razorpay. Confirm the total before paying.
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
