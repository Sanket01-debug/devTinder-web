import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { useEffect } from "react";

const Requests = () => {
    const requests = useSelector((store) => store.requests);
    const dispatch = useDispatch();

    const reviewRequest = async (status, _id) => {
        try {
            await axios.post(
                BASE_URL + "/request/review/" + status + "/" + _id,
                {},
                { withCredentials: true }
            );

            dispatch(removeRequest(_id));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get(
                BASE_URL + "/user/requests/received",
                {
                    withCredentials: true,
                }
            );

            dispatch(addRequests(res.data.data));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    if (!requests) return null;

    if (requests.length === 0)
        return (
            <h1 className="text-center text-3xl my-10">
                No Requests Found
            </h1>
        );

    return (
        <div className="text-center my-10">
            <h1 className="font-bold text-white text-3xl mb-8">
                Connection Requests
            </h1>

            {requests.map((request) => {
                const {
                    _id,
                    firstName,
                    lastName,
                    photoUrl,
                    age,
                    gender,
                    about,
                } = request.fromUserId;

                return (
                    <div
                        key={_id}
                        className="flex items-center m-4 p-4 rounded-lg bg-base-300 w-1/2 mx-auto"
                    >
                        <img
                            alt="photo"
                            className="w-20 h-20 rounded-full object-cover"
                            src={photoUrl}
                        />

                        <div className="text-left mx-4 flex-1">
                            <h2 className="font-bold text-xl">
                                {firstName} {lastName}
                            </h2>

                            {age && gender && (
                                <p>
                                    {age}, {gender}
                                </p>
                            )}

                            <p>{about}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition duration-200 shadow-md hover:shadow-lg"
                                onClick={() => reviewRequest("rejected", request._id)}
                            >
                                ❌ Reject
                            </button>

                            <button
                                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition duration-200 shadow-md hover:shadow-lg"
                                onClick={() => reviewRequest("accepted", request._id)}
                            >
                                ✅ Accept
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Requests;