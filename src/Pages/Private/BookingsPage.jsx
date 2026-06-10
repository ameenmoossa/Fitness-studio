import { useEffect, useState } from "react";
import moment from "moment";
import { ApiCall } from "../../Services/ApiCall";

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [pagination, setPagination] = useState({
    is_next: false,
    is_prev: false,
  });
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
  });

  const extractArray = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data?.docs)) return responseData.data.docs;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.docs)) return responseData.docs;
    if (Array.isArray(responseData?.result)) return responseData.result;
    return [];
  };

  const fetchClasses = async () => {
    const res = await ApiCall("get", "/classes/class-types");

    if (res.status) {
      setClassList(extractArray(res.message));
    } else {
      setClassList([]);
    }
  };
const fetchBookings = async (classId = "", showLoader = true) => {
  if (showLoader) {
    setLoading(true);
  } else {
    setSearchLoading(true);
  }

  const payload = {
    ...(classId && { class_id: classId }),
  };

  const res = await ApiCall("post", "/class-booking/listing", payload, params);

  if (res.status) {
    const data = res?.data || res?.message?.data || res?.message;
    setBookings(data?.docs || []);
    setPagination({
      is_next: data?.hasNextPage || false,
      is_prev: data?.hasPrevPage || false,
    });
  } else {
    setBookings([]);
    setPagination({
      is_next: false,
      is_prev: false,
    });
  }

  if (showLoader) {
    setLoading(false);
  } else {
    setSearchLoading(false);
  }
};

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;

    console.log("Booking ID:", id);

    const res = await ApiCall("post", "/class-booking/cancel", {
      booking_id: id,
    });

    if (res.status) {
      fetchBookings(selectedClassId);
    }
  };

  const handleSearch = () => {
    fetchBookings(selectedClassId, false);
  };

  const getClassName = (booking) =>
    booking?.class_id?.name || booking?.class?.name || "-";

  const getClassStartDate = (booking) =>
    booking?.class_id?.start_date || booking?.class?.start_date || null;

  const getClassOptionLabel = (item) => item?.name || "-";

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedBookings = () => {
    if (!sortConfig.key) return bookings;

    const sorted = [...bookings].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'date') {
        aValue = new Date(a?.class_id?.start_date || 0).getTime();
        bValue = new Date(b?.class_id?.start_date || 0).getTime();
      } else if (sortConfig.key === 'time') {
        const aTime = a?.class_id?.start_time || '00:00';
        const bTime = b?.class_id?.start_time || '00:00';
        aValue = aTime;
        bValue = bTime;
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  };

  useEffect(() => {
    fetchClasses();
    fetchBookings();
  }, [params.page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-content">
      <div className="container-fluid">
        <h4 className="mb-4">Bookings Management</h4>

        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-3">
                <label className="form-label">Class</label>

                <select
                  className="form-control"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">All Classes</option>

                  {classList.map((item) => (
                    <option key={item._id} value={item._id}>
                      {getClassOptionLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mt-3 mt-md-0">
                <button
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={searchLoading}
                >
                  {searchLoading ? "Loading..." : "Search"}
                </button>
              </div>
            </div>
          </div>
        </div>

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
                  <th>Studio</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('time')}>
                    Time {sortConfig.key === 'time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No Bookings Found
                    </td>
                  </tr>
                ) : (
                  getSortedBookings().map((booking, index) => (
                    <tr key={booking._id || index}>
                      <td>{index + 1}</td>

                      <td>
  {booking?.user_id?.name || "-"}
</td>

                      <td>{getClassName(booking)}</td>

                      <td>{booking?.studio_id?.name || "-"}</td>

                      <td>
                        {getClassStartDate(booking)
                          ? moment(getClassStartDate(booking)).format("DD-MM-YYYY")
                          : "-"}
                      </td>

                      <td>
                        {booking?.class_id?.start_time || booking?.class?.start_time || "-"}
                      </td>

                      <td>{booking?.status || "-"}</td>

                      <td>
                        {booking?.status !== "cancelled" && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              cancelBooking(booking?._id || booking?.booking_id || booking?.id)
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!pagination.is_next && !pagination.is_prev ? null : (
          <nav className="mt-4 d-flex justify-content-end">
            <ul className="pagination mb-0">
              <li
                style={{ cursor: pagination.is_prev ? "pointer" : "not-allowed" }}
                className={`page-item ${pagination.is_prev ? "" : "disabled"}`}
                onClick={() => pagination.is_prev && setParams({ ...params, page: params.page - 1 })}
              >
                <a className="page-link" href={undefined} tabIndex="-1">
                  Previous
                </a>
              </li>
              <li
                style={{ cursor: pagination.is_next ? "pointer" : "not-allowed" }}
                className={`page-item ${pagination.is_next ? "" : "disabled"}`}
                onClick={() => pagination.is_next && setParams({ ...params, page: params.page + 1 })}
              >
                <a className="page-link" href={undefined}>
                  Next
                </a>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

export default BookingsPage;




