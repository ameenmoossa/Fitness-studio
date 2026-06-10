
import Header from "../Layout/Header";
import Sidebar from "../Layout/Sidebar";
import { Outlet } from "react-router-dom";
import Footer from "../Layout/Footer";

function RoutesPage() {
  return (
    <div id="layout-wrapper">
      <Header />
      <Sidebar />
      <div className="main-content">
        <div className="section-shell">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default RoutesPage;
