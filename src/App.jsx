








































import { Route, Routes } from "react-router-dom";
import RoutesPage from "./Routes/RoutesPage";
import DashboardPage from "./Pages/Private/DashboardPage";
import StudioPage from "./Pages/Private/StudioPage";
import Login from "./Pages/Common/Login";
import { PrivateRoute } from "./utils/PrivateRoute";
import InstructorPage from "./Pages/Private/InstructorPage";
import ClassPage from "./Pages/Private/ClassPage";
import PlanPage from "./Pages/Private/PlanPage";
import ErrorPage from "./Pages/Common/ErrorPage";
import StudioClasses from "./Pages/Private/StudioClasses";
import AttendancePage from "./Pages/Private/AttendancePage";
import UsersPage from "./Pages/Private/UsersPage";
import Subscriptions from "./Pages/Private/Subscriptions";
import Payment from "./Pages/Private/Payment";
import UserDetails from "./Pages/Private/UserDetails";

/* ✅ NEW IMPORTS */
// import CalendarPage from "./Pages/Private/CalendarPage";
import BookingsPage from "./Pages/Private/BookingsPage";
import WaitlistPage from "./Pages/Private/WaitlistPage";
import AttendanceKiosk from "./Pages/Private/AttendanceKiosk";

function App() {
  return (
    <Routes>
      <Route element={<Login />} path="/login" />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <RoutesPage />
          </PrivateRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* Existing Routes */}
        <Route path="studio" element={<StudioPage />} />
        <Route path="instructor" element={<InstructorPage />} />
        <Route path="class" element={<ClassPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="studioclasses" element={<StudioClasses />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="payment" element={<Payment />} />
        <Route path="user-detail/:userId" element={<UserDetails />} />

        {/* ✅ NEW ROUTES */}
        {/* <Route path="calendar" element={<CalendarPage />} /> */}
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="waitlist" element={<WaitlistPage />} />
      </Route>
      {/* /// ✅ NEW ROUTE - Attendance Kiosk */}
      <Route path="/kiosk" element={<AttendanceKiosk />} />

      {/* 404 */}
      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );
}

export default App;











