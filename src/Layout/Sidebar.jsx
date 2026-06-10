import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContextDatas } from "../Services/Context";

function Sidebar() {
  const navigate = useNavigate();
  const { user } = useContext(ContextDatas);
  const [logoVisible, setLogoVisible] = useState(true);

  const isActive = (path) => (window.location.pathname === path ? "mm-active" : "");

  const superAdminMenu = [
    { path: "/", label: "Dashboard", icon: "bx bxs-dashboard" },
    { path: "/studio", label: "Studio", icon: "bx bxs-building-house" },
    { path: "/instructor", label: "Instructor", icon: "bx bxs-user" },
    { path: "/class", label: "Class", icon: "bx bx-pen" },
    { path: "/plan", label: "Plan", icon: "bx bx-dollar" },
    { path: "/users", label: "Users", icon: "bx bxs-group" },
    { path: "/attendance", label: "Attendance", icon: "bx bx-edit" },
    { path: "/bookings", label: "Bookings", icon: "bx bx-book-content" },
    { path: "/waitlist", label: "Waitlist", icon: "bx bx-time-five" },
    { path: "/subscriptions", label: "Subscriptions", icon: "bx bx-calendar" },
    { path: "/payment", label: "Payment", icon: "bx bx-credit-card" },
  ];

  const studioAdminMenu = [
    { path: "/studioclasses", label: "Studio Classes", icon: "bx bx-pen" },
    { path: "/attendance", label: "Attendance", icon: "bx bx-edit" },
  ];

  const menu = user === "super_admin" ? superAdminMenu : studioAdminMenu;

  return (
    <div className="vertical-menu">
      <div data-simplebar className="h-100">
        <button
          type="button"
          className="sidebar-brand sidebar-brand-top"
          onClick={() => navigate("/")}
          aria-label="Go to dashboard"
        >
          <span className="sidebar-brand-mark" aria-hidden="true">
            {logoVisible ? (
              <img
                src="/assets/images/logo1.png"
                alt="Fitness Studio"
                className="sidebar-brand-logo"
                onError={() => setLogoVisible(false)}
              />
            ) : (
              <span className="sidebar-brand-fallback-icon">FS</span>
            )}
          </span>
          <span className="sidebar-brand-copy">
            <span className="sidebar-brand-title">Fitness Studio</span>
            <span className="sidebar-brand-subtitle">Admin Console</span>
          </span>
        </button>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled mt-4" id="side-menu">
            {menu.map((item) => (
              <li key={item.path} className={isActive(item.path)}>
                <a
                  href={item.path}
                  className="waves-effect"
                  onClick={(e) => {
                    e.preventDefault();

                    if (item.path === "/attendance") {
                      navigate(item.path, {
                        state: {
                          refreshKey: Date.now(),
                        },
                      });
                      return;
                    }

                    navigate(item.path);
                  }}
                >
                  <i className={item.icon} />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
