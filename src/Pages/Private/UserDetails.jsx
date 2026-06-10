import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ApiCall } from "../../Services/ApiCall";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

function UserDetails() {
    const { userId } = useParams();
    const [userData, setUserData] = useState();
    const [activity, setActivity] = useState();
    const [statusSummery, setStatusSummery] = useState();
    const [page, setPage] = useState({ page: 1, limit: 10 });
    const [is_next, setis_next] = useState(false);


    useEffect(() => {
        getUserDetails();
        getUserActivities();
    }, [page.page]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateUserProfile = async () => {
const payload = {
  user_id: userId,
  name: userData?.details?.name,   // ✅ FIXED
  email: userData?.details?.user_id?.email,
  mobile: userData?.details?.user_id?.mobile,
};

  const res = await ApiCall("put", "/users/customer", payload);

  if (res.status) {
    alert("Profile updated successfully");
    getUserDetails();
  }
};   

    const getUserDetails = async () => {
        if (userId) {
            const response = await ApiCall("get", `/users/${userId}`);
            if (response?.status) setUserData(response?.message);
        }
    };

    const getUserActivities = async () => {
        if (userId) {
          const response = await ApiCall(
  "post",
  "/booking/user-history",
  { user_id: userId }
);
            if (response?.status) {
setActivity(response?.data);                setStatusSummery(response?.message?.statusSummary);
                setis_next(response?.message?.hasNextPage || false);
            }
        }
    };

    const formatDays = (days) => {
        if (!days || days <= 0) return "0 days";
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        const remainingDays = (days % 365) % 30;

        if (years > 0 && months > 0) {
            return `${years} year${years > 1 ? "s" : ""} ${months} month${months > 1 ? "s" : ""
                }`;
        } else if (years > 0) {
            return `${years} year${years > 1 ? "s" : ""}`;
        } else if (months > 0) {
            return `${months} month${months > 1 ? "s" : ""}`;
        } else {
            return `${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
        }
    };

    // Map backend status values to Bootstrap badge classes
    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "enrolled":
            case "booked":
                return "bg-primary";
            case "completed":
                return "bg-success";
            case "waiting":
                return "bg-warning text-dark";
            case "cancelled":
                return "bg-danger";
            case "absent":
                return "bg-secondary";
            default:
                return "bg-dark"; // fallback for unknown status
        }
    };


    return (
        <div>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="card">
                                <div className="card-body">
                                    <h4 className="card-title mb-4">User Profile</h4>

                                    {/* User Info */}
                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-2">
<strong>Name:</strong>
<input
  type="text"
  className="form-control"
  value={userData?.details?.name || ""}
  onChange={(e) =>
    setUserData({
      ...userData,
      details: {
        ...userData.details,
        name: e.target.value,
      },
    })
  }
/>                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <strong>Email:</strong>{" "}
<input
  type="text"
  className="form-control"
  value={userData?.details?.user_id?.email || ""}
  onChange={(e) =>
    setUserData({
      ...userData,
      details: {
        ...userData.details,
        user_id: {
          ...userData.details.user_id,
          email: e.target.value,
        },
      },
    })
  }
/>                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <strong>Mobile:</strong>{" "}
                                            <PhoneInput
                                              country={"in"}
                                              value={userData?.details?.user_id?.mobile || ""}
                                              onChange={(phone) =>
                                                setUserData({
                                                  ...userData,
                                                  details: {
                                                    ...userData.details,
                                                    user_id: {
                                                      ...userData.details.user_id,
                                                      mobile: phone,
                                                    },
                                                  },
                                                })
                                              }
                                              inputClass="form-control"
                                              containerClass="w-100 mt-1"
                                              inputProps={{
                                                required: true,
                                                placeholder: "Mobile",
                                              }}
                                              disableDropdown={false}
                                              inputStyle={{ width: "100%" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <strong>Gender:</strong> {userData?.details?.gender}
                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <strong>Joined:</strong>{" "}
                                            {`${formatDays(userData?.joinedDays)} ago`}
                                        </div>
                                        <div className="col-12 mt-3">
  <button className="btn btn-primary" onClick={updateUserProfile}>
    Update Profile
  </button>
</div>
                                    </div>

                                    {/* Summary */}
                                    <div className="mb-4">
                                        <span className="badge bg-success me-2 p-2">
                                            Attended: {statusSummery?.enrolled}
                                        </span>
                                        <span className="badge bg-primary me-2 p-2">
                                            Booked: {statusSummery?.booked}
                                        </span>
                                        <span className="badge bg-warning me-2 p-2">
                                            Waiting: {statusSummery?.waiting}
                                        </span>
                                        <span className="badge bg-danger p-2">
                                            Cancelled: {statusSummery?.cancelled}
                                        </span>
                                    </div>

                                    {/* Activities */}
                                    <h5 className="card-title mb-3">User Activities</h5>
                                    {activity?.length > 0 ? (
                                        activity.map((item, index) => (
                                            <div key={index} className="mb-3 p-3 border rounded bg-light">
                                              <p><strong>Class:</strong> {item.class_name}</p>
<p><strong>Studio:</strong> {item.studio}</p>
<p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
<p><strong>Time:</strong> {new Date(item.date).toLocaleTimeString()}</p>
                                                <p className=" d-flex align-items-center ">
                                                    <strong>Status:</strong>{" "}
                                                    <span className={`badge px-2 py-1 rounded ms-2 ${getStatusClass(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted">No activities found.</p>
                                    )}


                                    {/* Pagination */}
                                    {(is_next || page.page > 1) && (
                                        <nav aria-label="Page navigation">
                                            <ul className="pagination justify-content-end mt-2">
                                                <li
                                                    className={`page-item ${page.page === 1 ? "disabled" : ""
                                                        }`}
                                                    onClick={() =>
                                                        page.page > 1 &&
                                                        setPage({ ...page, page: page.page - 1 })
                                                    }
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <a className="page-link">Previous</a>
                                                </li>
                                                <li
                                                    className={`page-item ${!is_next ? "disabled" : ""}`}
                                                    onClick={() =>
                                                        is_next &&
                                                        setPage({ ...page, page: page.page + 1 })
                                                    }
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <a className="page-link">Next</a>
                                                </li>
                                            </ul>
                                        </nav>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        
    );
    
}


export default UserDetails;
