import { useEffect, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";

function WaitlistPage() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWaitlist = async () => {
    setLoading(true);

const res = await ApiCall(
  "post",
  "/class-booking/listing",
  { status: "waiting" },
  null,
  "application/json"
);
    if (res.status) {
const responseData = res.message;
let bookingArray = [];

if (Array.isArray(responseData)) {
  bookingArray = responseData;
} else if (Array.isArray(responseData?.data?.docs)) {
  bookingArray = responseData.data.docs;
}
console.log("FINAL DATA:", responseData);
     

     setWaitlist(bookingArray);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

 const approveFromWaitlist = async (booking) => {
  const payload = {
    id: booking._id,        // ✅ FIXED
    status: "booked",       // ✅ FIXED
  };

  const res = await ApiCall("put", "/class-booking", payload, null);

  if (res.status) {
    fetchWaitlist();
  }
};

  const removeFromWaitlist = async (booking) => {
    const payload = {
      booking_id: booking._id,
    };

const res = await ApiCall("post", "/class-booking/cancel", payload, null);
    if (res.status) {
      fetchWaitlist();
    }
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <h4 className="mb-4">Waitlist Management</h4>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Class</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {waitlist.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No Waitlist Entries
                    </td>
                  </tr>
                ) : (
                  waitlist.map((booking, index) => (
                    <tr key={booking._id}>
                      <td>{index + 1}</td>

                     <td>{booking?.user_id?.name || "-"}</td>
<td>{booking?.class_id?.name || "-"}</td>

                      {/* Position */}
                      <td>{index + 1}</td>

                      {/* Status */}
                      <td>{booking?.status || "waitlist"}</td>

                      <td>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => approveFromWaitlist(booking)}
                        >
                          Approve
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => removeFromWaitlist(booking)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitlistPage;

