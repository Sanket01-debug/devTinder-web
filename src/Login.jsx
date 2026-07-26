const Login = () => {

  

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
              placeholder="Enter your email"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control w-full mt-2">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="input input-bordered w-full"
            />
          </div>

          <div className="card-actions justify-center mt-6">
            <button className="btn btn-primary w-full">
              Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;