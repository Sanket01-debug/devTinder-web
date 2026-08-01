import React from "react";

const UserCard = ({ user }) => {
    if (!user) return null;

    const { firstName, lastName, photoUrl, age, gender, about } = user;

    return (
        <div className="card bg-base-300 w-80 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <figure className="h-80 bg-base-200 overflow-hidden">
                <img
                    src={photoUrl}
                    alt="photo"
                    className="w-full h-full object-cover object-top"
                />
            </figure>

            <div className="card-body p-5">
                <h2 className="card-title text-xl font-semibold">
                    {firstName} {lastName}
                </h2>

                {age && gender && (
                    <p className="text-sm text-gray-300">
                        {age}, {gender}
                    </p>
                )}

                <p className="text-sm leading-6 text-gray-200 mt-1">
                    {about}
                </p>

                <div className="card-actions justify-center gap-4 mt-5">
                    <button className="btn h-10 w-28 bg-blue-500 hover:bg-blue-600 text-white border-none">
                        Ignore
                    </button>

                    <button className="btn h-10 w-28 bg-pink-500 hover:bg-pink-600 text-white border-none">
                        Interested
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCard;