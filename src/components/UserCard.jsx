import React from 'react'

const UserCard = ({ user }) => {
    const { firstName, lastName, photoUrl, age, gender, about } = user;
    return (
        <div className="card bg-base-300 w-96 border border-white/5 rounded-xl shadow-xl">
            <figure>
                <img
                    src={user.photoUrl}
                    alt="photo" />
            </figure>
            <div className="card-body">
                <h2 className="card-title">{firstName + " " + lastName}</h2>
                {age && gender && <p>{age + ", " + gender}</p>}
                <p>{about}</p>
                <div className="card-actions justify-center my-4">
                    <div className="card-actions justify-center gap-4 my-4">
                        <button className="btn w-28 bg-blue-500 hover:bg-blue-600 text-white border-none">
                            Ignore
                        </button>

                        <button className="btn w-28 bg-pink-500 hover:bg-pink-600 text-white border-none">
                            Interested
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserCard;
