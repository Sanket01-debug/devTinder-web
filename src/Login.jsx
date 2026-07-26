import axios from "axios";
import { useState } from "react";

const Login = () => {

  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:7777/login", {
        emailId,
        password,
      }, { withCredentials: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <div className="card bg-base-300 w-96 shadow-xl">
        <div className="card-body">

          <h2 className="card-title justify-center mb-4">
            Login
          </h2>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Email ID</span>
            </label>

            <input
              type="email"
              value={emailId}
              className="input input-bordered w-full"
              onChange={(e) => setEmailId(e.target.value)}
            />
          </div>


          <div className="form-control w-full mt-2">
            <label className="label">
              <span className="label-text">Password</span>
            </label>

            <input
              type="text"
              value={password}
              className="input input-bordered w-full"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>


          <div className="card-actions justify-center mt-6">
            <button
              className="btn w-full bg-blue-600 hover:bg-blue-700 text-white border-none"
              onClick={handleLogin}
            >
              Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;