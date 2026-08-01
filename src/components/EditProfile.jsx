import { useState } from "react";
import UserCard from "./UserCard";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";

const EditProfile = ({ user }) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [photoUrl, setPhotoUrl] = useState(user.photoUrl);
    const [age, setAge] = useState(user.age || "");
    const [gender, setGender] = useState(user.gender || "");
    const [about, setAbout] = useState(user.about || "");
    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState(false);

    const dispatch = useDispatch();

    const saveProfile = async () => {
        setError("");

        try {
            const res = await axios.patch(
                BASE_URL + "/profile/edit",
                {
                    firstName,
                    lastName,
                    photoUrl,
                    age,
                    gender,
                    about,
                },
                { withCredentials: true }
            );

            dispatch(addUser(res?.data?.data));

            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        } catch (err) {
            setError(err?.response?.data || "Something went wrong");
        }
    };

    return (
        <>
            <div className="flex justify-center items-start gap-10 my-10 mb-20 flex-wrap">
                
                {/* Edit Profile Card */}
                <div className="card bg-base-300 w-96 shadow-xl">
                    <div className="card-body p-7">
                        <h2 className="card-title justify-center mb-4 text-2xl">
                            Edit Profile
                        </h2>

                        <div className="space-y-4">

                            <label className="form-control w-full">
                                <div className="label pb-1">
                                    <span className="label-text">First Name</span>
                                </div>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="input input-bordered w-full h-11 px-4"
                                />
                            </label>

                            <label className="form-control w-full">
                                <div className="label pb-1">
                                    <span className="label-text">Last Name</span>
                                </div>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="input input-bordered w-full h-11 px-4"
                                />
                            </label>

                            <label className="form-control w-full">
                                <div className="label pb-1">
                                    <span className="label-text">Photo URL</span>
                                </div>
                                <input
                                    type="text"
                                    value={photoUrl}
                                    onChange={(e) => setPhotoUrl(e.target.value)}
                                    className="input input-bordered w-full h-11 px-4"
                                />
                            </label>

                            <label className="form-control w-full">
                                <div className="label pb-1">
                                    <span className="label-text">Age</span>
                                </div>
                                <input
                                    type="text"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="input input-bordered w-full h-11 px-4"
                                />
                            </label>

                            <label className="form-control w-full">
                                <div className="label pb-1">
                                    <span className="label-text">Gender</span>
                                </div>
                                <input
                                    type="text"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="input input-bordered w-full h-11 px-4"
                                />
                            </label>

                            <label className="form-control w-full">
                                <div className="label pb-1">
                                    <span className="label-text">About</span>
                                </div>
                                <input
                                    type="text"
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    className="input input-bordered w-full h-11 px-4"
                                />
                            </label>

                        </div>

                        {error && (
                            <p className="text-red-500 text-center mt-2">
                                {error}
                            </p>
                        )}

                        <div className="card-actions justify-center mt-5">
                            <button
                                onClick={saveProfile}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white border-none px-8"
                            >
                                Save Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <UserCard
                    user={{
                        firstName,
                        lastName,
                        photoUrl,
                        age,
                        gender,
                        about,
                    }}
                />
            </div>

            {showToast && (
                <div className="toast toast-top toast-center">
                    <div className="alert alert-success">
                        <span>Profile saved successfully.</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditProfile;