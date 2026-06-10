import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import moment from "moment";
import { ApiCall } from "../../Services/ApiCall";
import { currency } from "../../constants/constants";

function DashboardPage() {
  const [cardData, setCardData] = useState({});
  const [revenueChart, setRevenueChart] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [report, setReport] = useState({});
  
  const [params] = useState({
    sort: -1,
    limit: 6,
    page: 1,
  });

 useEffect(() => {
  getDashboardData();
  getRevenueChartData();
  getPiechartData();
  getLatestBokkings();
  getAttendanceReport(); // ✅ ADD THIS
}, []);
  const COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#e11d48", "#9333ea"];

  const getDashboardData = async () => {
    const response = await ApiCall("get", "/dashboard");
    setCardData(response?.message || {});
  };

  const getRevenueChartData = async () => {
    const response = await ApiCall("get", "/dashboard/revenue");
    setRevenueChart(response?.message || []);
  };

  const getPiechartData = async () => {
    const response = await ApiCall("get", "/dashboard/revenue-chart");
    const raw = response?.message;

    const source = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.docs)
        ? raw.docs
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

    const normalized = source
      .map((item) => {
        const studio =
          item?.studio ??
          item?.studioName ??
          item?.name ??
          item?.studio_id?.name ??
          "Unknown Studio";

        const revenue = Number(
          item?.revenue ?? item?.price ?? item?.totalRevenue ?? 0
        );

        return { studio, revenue };
      })
      .filter((item) => item.studio && !Number.isNaN(item.revenue));

    setPieChartData(normalized);
  };

  const getLatestBokkings = async () => {
    const data = { status: "booked" };
    const response = await ApiCall("post", "/class-booking/listing", data, params);
    setBookingData(response?.message?.data?.docs || []);
  };
  const getAttendanceReport = async () => {
  const res = await ApiCall("get", "/class-booking/admin-report");
  setReport(res?.data || {});
};

  const total = pieChartData.reduce((sum, item) => sum + item.revenue, 0);

  const safeData = total === 0
    ? pieChartData.map((item) => ({ ...item, revenue: 1 }))
    : pieChartData;

  return (
    <div className="page-content dashboard-v2">
      <div className="container-fluid">
        <div className="dashboard-v2-hero mb-4">
          <div>
            <h3 className="mb-1">Operations Command</h3>
            <p className="mb-0">Live snapshot of revenue, studio output, and bookings.</p>
          </div>
          <div className="dashboard-v2-actions">
            <Link to="/bookings" className="btn btn-light btn-sm">
              Open Bookings
            </Link>
            {/* <Link to="/attendance" className="btn btn-outline-light btn-sm">
              Mark Attendance
            </Link> */}
          </div>
        </div>

      <div className="row g-3 mb-3">

  <div className="col-6 col-xl-3">
    <div className="stat-pill">
      <span>Total Revenue</span>
      <h4>{currency} {cardData?.totalRevenue || 0}</h4>
    </div>
  </div>

  <div className="col-6 col-xl-3">
    <div className="stat-pill">
      <span>Total Studios</span>
      <h4>{cardData?.totalStudios || 0}</h4>
    </div>
  </div>

  <div className="col-6 col-xl-3">
    <div className="stat-pill">
      <span>Total Bookings</span>
      <h4>{cardData?.totalBooking || 0}</h4>
    </div>
  </div>

  <div className="col-6 col-xl-3">
    <div className="stat-pill">
      <span>Total Cancellations</span>
      <h4>{cardData?.totalCancelled || 0}</h4>
    </div>
  </div>

  {/* ✅ ADD THESE INSIDE SAME ROW */}

  <div className="col-6 col-xl-3">
    <div className="stat-pill">
      <span>Total Attended</span>
      <h4>{cardData?.totalAttended || 0}</h4>
    </div>
  </div>

  <div className="col-6 col-xl-3">
    <div className="stat-pill">
      <span>Waiting</span>
      <h4>{report?.total_waiting || 0}</h4>
    </div>
  </div>

  <div className="col-6 col-xl-3">
    <div className="stat-pill">
      <span>Attendance Rate</span>
      <h4>{report?.attendance_rate || "0%"}</h4>
    </div>
  </div>

</div>


        <div className="row">
          <div className="col-12 col-lg-8 mb-4">
            <div className="card dashboard-v2-card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Revenue Trend</h4>
                  <span className="chip-soft">Monthly Flow</span>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${currency}${Math.round(value / 1000)}k`}
                    />
                    <Tooltip
                      formatter={(value) => `${currency} ${Number(value).toLocaleString()}`}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #dbe3f1" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0f766e"
                      strokeWidth={3}
                      fill="url(#revFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
             
            
            

          </div>

          <div className="col-12 col-lg-4 mb-4">
            <div className="card dashboard-v2-card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Studio Split</h4>
                  <span className="chip-soft">Revenue Share</span>
                </div>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                 <Pie
  data={safeData}
  dataKey="revenue"
  nameKey="studio"
  cx="50%"        // ✅ center horizontally
  cy="50%"        // ✅ center vertically
  innerRadius={60}
  outerRadius={130}
  paddingAngle={3}
  isAnimationActive={true}
>
  {safeData.map((entry, index) => (
    <Cell
      key={`${entry?.studio}-${index}`}
      fill={COLORS[index % COLORS.length]}
    />
  ))}
</Pie>
                      <Tooltip formatter={(value) => `${currency} ${Number(value).toLocaleString()}`} />
                      <Legend verticalAlign="bottom" height={30} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: 320 }}>
                    <p className="text-muted mb-0">No studio revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card dashboard-v2-card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="card-title mb-0">Latest Bookings</h4>
              <Link to="/bookings" className="btn btn-primary btn-sm">View All</Link>
            </div>

            <div className="table-responsive">
              {bookingData.length > 0 ? (
                <table className="table align-middle table-nowrap">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>User</th>
                      <th>Class</th>
                      <th>Studio</th>
                      <th>Duration</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingData.map((item, index) => (
                     <tr key={item?._id || index}>
  <td>{index + 1}</td>
  <td>{item?.user_id?.email || "-"}</td>
  <td>{item?.class_id?.name || "-"}</td>
  <td>{item?.studio_id?.name || "-"}</td>
  <td>{item?.class_id?.duration || 0} min</td>
  <td>-</td>
  <td>{moment(item?.class_id?.start_date).format("DD-MM-YYYY hh:mm A")}</td>
</tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center mt-3 mb-1">No Data Available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Helmet>
        <title>Dashboard</title>
      </Helmet>
    </div>
  );
}

export default DashboardPage;
