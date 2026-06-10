import { useCallback, useContext, useEffect, useState } from "react";
import moment from "moment";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { ApiCall } from "../../Services/ApiCall";
import { ContextDatas } from "../../Services/Context";

function AttendancePage() {
  const { user } = useContext(ContextDatas);
  const location = useLocation();

  const getDefaultSearchData = useCallback(
    () => ({
      class_type_id: "",
      studio_id: user === "super_admin" ? "" : localStorage.getItem("_id"),
    }),
    [user]
  );

  const [buttonLoading, setbuttonLoading] = useState(false);
  const [studio_list, setstudio_list] = useState([]);
  const [search_data, setsearch_data] = useState(getDefaultSearchData);
  const [bookings, setbookings] = useState([]);
  const [classtype, setClasstype] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [pagination, setPagination] = useState({
    is_next: false,
    is_prev: false,
  });
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
  });

  const extractAttendanceRows = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.data?.docs)) return responseData.data.docs;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.docs)) return responseData.docs;
    if (Array.isArray(responseData?.result)) return responseData.result;
    return [];
  };

  const getClasses = useCallback(async () => {
    await ApiCall("get", "/classes/class-types");
  }, []);

  const getClassType = useCallback(async () => {
    const response = await ApiCall("get", "/classes/class-types");

    if (response.status) {
      setClasstype(response.message);
    }
  }, []);

  const getStudios = useCallback(async () => {
    const response = await ApiCall("get", "/studios/list");

    if (response.status) {
      setstudio_list(response.message.docs);
    }
  }, []);

  const runAttendanceFetch = useCallback(async (payload) => {
    setbuttonLoading(true);

    const response = await ApiCall("post", "/attendance/history", payload, params);

    setbuttonLoading(false);

    if (!response?.status) {
      setbookings([]);
      setPagination({
        is_next: false,
        is_prev: false,
      });
      return;
    }

    // Backend returns { data: { docs: [...], hasNextPage, ... } }
    // ApiCall wraps it as { status: true, message: { data: {...} } }
    const data = response?.message?.data || response?.data || response?.message;
    const docs = data?.docs || [];
    
    console.log("Attendance response:", response);
    console.log("Extracted docs:", docs);
    
    setbookings(docs);
    setPagination({
      is_next: data?.hasNextPage || false,
      is_prev: data?.hasPrevPage || false,
    });
  }, [params]);

  const fetchAttendance = useCallback(() => {
    const payload = {};

    if (search_data.class_type_id) {
      payload.class_type_id = search_data.class_type_id;
    }

    if (search_data.studio_id) {
      payload.studio_id = search_data.studio_id;
    }

    return runAttendanceFetch(payload);
  }, [runAttendanceFetch, search_data]);

  useEffect(() => {
    getClasses();
    getStudios();
    getClassType();
    fetchAttendance(); // Fetch attendance on initial load
  }, [getClasses, getStudios, getClassType, fetchAttendance]);

  useEffect(() => {
    if (params.page > 1) {
      fetchAttendance();
    }
  }, [params.page, fetchAttendance]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!location.state?.refreshKey) {
      return;
    }

    const defaultSearchData = getDefaultSearchData();
    setsearch_data(defaultSearchData);
    setbookings([]);
    getClasses();
    getStudios();
    getClassType();
    runAttendanceFetch(defaultSearchData);
  }, [
    getClassType,
    getClasses,
    getDefaultSearchData,
    getStudios,
    location.state?.refreshKey,
    runAttendanceFetch,
  ]);

  const getUserName = (value) =>
    value?.user_name || value?.user_email || value?.user_id?.username || "-";

  const getStudioName = (value) =>
    value?.studio_id?.name || value?.studio?.name || value?.studio_name || "-";

  const getClassName = (value) =>
    value?.class_id?.name || value?.class?.name || value?.class_name || "-";

  const getAttendanceDate = (value) => value?.start_date || value?.date || null;

  const getAttendanceStatus = (value) => value?.status || "Attended";

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

      if (sortConfig.key === 'dateTime') {
        const aDate = a?.start_date || a?.date || '';
        const aTime = a?.start_time || '00:00';
        const bDate = b?.start_date || b?.date || '';
        const bTime = b?.start_time || '00:00';
        
        aValue = new Date(`${aDate} ${aTime}`).getTime();
        bValue = new Date(`${bDate} ${bTime}`).getTime();
      }

      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  };

  return (
    <div>
      <div className="page-content">
        <div className="container-fluid">
          <h4 className="mb-3">Attendance</h4>

          <div className="row">
            <div className="col-xl-12">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">Filter</h4>

                  <div className="row align-items-end">
                    <div className="col-md-4">
                      <label>Class</label>
                      <select
                        className="form-control"
                        value={search_data.class_type_id}
                        onChange={(e) =>
                          setsearch_data({
                            ...search_data,
                            class_type_id: e.target.value,
                          })
                        }
                      >
                        <option value="">All Classes</option>
                        {classtype.map((value) => (
                          <option key={value._id} value={value._id}>
                            {value.name || "-"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label>Studio</label>
                      <select
                        className="form-control"
                        value={search_data.studio_id}
                        onChange={(e) =>
                          setsearch_data({
                            ...search_data,
                            studio_id: e.target.value,
                          })
                        }
                      >
                        <option value="">All Studios</option>
                        {studio_list.map((studio) => (
                          <option key={studio._id} value={studio._id}>
                            {studio.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <button
                        className="btn btn-primary w-100"
                        onClick={fetchAttendance}
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? "Loading..." : "Search"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h4>Attendance</h4>

              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Class</th>
                      <th>Studio</th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('dateTime')}>
                        Date & Time {sortConfig.key === 'dateTime' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.length ? (
                      getSortedBookings().map((value, key) => {
                        const attendanceDate = getAttendanceDate(value);
                        const studioName = getStudioName(value);

                        return (
                          <tr key={value?._id || key}>
                            <td>{key + 1}</td>
                            <td>{getUserName(value)}</td>
                            <td>{getClassName(value)}</td>
                            <td>{studioName}</td>
                            <td>
                              {attendanceDate && value?.start_time ? (
                                <div>
                                  <b>
                                    {moment(
                                      `${attendanceDate} ${value.start_time}`,
                                      "YYYY-MM-DD HH:mm"
                                    ).format("DD MMM YYYY")}
                                  </b>
                                  <br />
                                  <span className="text-muted">
                                    {moment(
                                      `${attendanceDate} ${value.start_time}`,
                                      "YYYY-MM-DD HH:mm"
                                    ).format("hh:mm A")}
                                  </span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>
                              <button className="btn btn-sm btn-success">
                                {getAttendanceStatus(value)}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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

          <Helmet>
            <title>Attendance</title>
          </Helmet>
        </div>
      </div>
    </div>
  );
}

export default AttendancePage;
