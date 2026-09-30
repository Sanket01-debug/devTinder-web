import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";

const fetchPremiumStatus = async () => {
  try {
    const res = await axios.get(BASE_URL + "/premium/verify", {
      withCredentials: true,
    });
    return !!res.data.isPremium;
  } catch (err) {
    console.error("Premium verify failed:", err);
    return false;
  }
};

const Premium = () => {
  const [isUserPremium, setIsUserPremium] = useState(null); // null = loading

  useEffect(() => {
    let ignore = false;

    fetchPremiumStatus().then((status) => {
      if (!ignore) setIsUserPremium(status);
    });

    return () => {
      ignore = true;
    };
  }, []);

  // Payment ke baad dobara check karne ke liye
  const refreshPremiumStatus = async () => {
    setIsUserPremium(await fetchPremiumStatus());
  };

  const handleBuyClick = async (type) => {
    try {
      if (!window.Razorpay) {
        alert("Payment service load nahi hua. Page refresh karke try karo.");
        return;
      }

      const order = await axios.post(
        BASE_URL + "/payment/create",
        { membershipType: type },
        { withCredentials: true }
      );

      const { amount, keyId, currency, notes, orderId } = order.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Dev Tinder",
        description: "Connect to other developers",
        order_id: orderId,
        prefill: {
          name: notes.firstName + " " + notes.lastName,
          email: notes.emailId,
        },
        theme: {
          color: "#F37254",
        },
        handler: refreshPremiumStatus,
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment init failed:", err);
      alert("Kuch galat ho gaya, dobara try karo.");
    }
  };

  if (isUserPremium === null) {
    return <div className="m-10 text-center">Loading...</div>;
  }

  if (isUserPremium) {
    return (
      <div className="m-10 text-center text-xl font-semibold">
        You are already a premium user 🎉
      </div>
    );
  }

  return (
    <div className="m-10">
      <div className="flex w-full">
        <div className="card bg-base-300 rounded-box grid h-80 flex-grow place-items-center">
          <h1 className="font-bold text-3xl">Silver Membership</h1>
          <ul>
            <li> - Chat with other people</li>
            <li> - 100 connection requests per day</li>
            <li> - Blue Tick</li>
            <li> - 3 months</li>
          </ul>
          <button
            onClick={() => handleBuyClick("silver")}
            className="btn btn-secondary"
          >
            Buy Silver
          </button>
        </div>

        <div className="divider divider-horizontal">OR</div>

        <div className="card bg-base-300 rounded-box grid h-80 flex-grow place-items-center">
          <h1 className="font-bold text-3xl">Gold Membership</h1>
          <ul>
            <li> - Chat with other people</li>
            <li> - Infinite connection requests per day</li>
            <li> - Blue Tick</li>
            <li> - 6 months</li>
          </ul>
          <button
            onClick={() => handleBuyClick("gold")}
            className="btn btn-primary"
          >
            Buy Gold
          </button>
        </div>
      </div>
    </div>
  );
};

export default Premium;