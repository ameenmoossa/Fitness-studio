import { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ContextDatas } from "../Services/Context";

const formatNotificationTime = (value) => {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const minutesDiff = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));

  if (minutesDiff < 60) {
    return `${minutesDiff} min ago`;
  }

  const hoursDiff = Math.floor(minutesDiff / 60);

  if (hoursDiff < 24) {
    return `${hoursDiff} hour${hoursDiff > 1 ? "s" : ""} ago`;
  }

  const daysDiff = Math.floor(hoursDiff / 24);
  return `${daysDiff} day${daysDiff > 1 ? "s" : ""} ago`;
};

const getNotificationDotType = (notification) => {
  const normalizedType = String(notification?.type || "info").toLowerCase();

  if (["success", "error", "info"].includes(normalizedType)) {
    return normalizedType;
  }

  return notification?.isAdmin ? "info" : "success";
};

function Header() {
  const navigate = useNavigate();
  const {
    setuser,
    user,
    notifications,
    unreadNotificationsCount,
    deleteNotification,
    markNotificationsRead,
  } = useContext(ContextDatas);
  const [modal, setmodal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const Logout = () => {
    localStorage.removeItem("rl");
    localStorage.removeItem("_id");
    setuser(null);
    return navigate("/login", { state: { fromLogout: true } });
  };

  return (
    <header id="page-topbar">
      <div className="navbar-header">
        <div className="d-flex align-items-center">
          <div className="fw-bold" style={{ color: "#1f3550", fontSize: "1rem" }}>
            Fitness Studio Admin
          </div>
        </div>

        <div className="d-flex align-items-center">
          <div className="topbar-notification-wrap" ref={notificationRef}>
            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Notifications"
              aria-expanded={showNotifications}
              onClick={() =>
                setShowNotifications((current) => {
                  const nextState = !current;

                  if (nextState) {
                    markNotificationsRead();
                  }

                  return nextState;
                })
              }
            >
              <i className="bx bx-bell" />
              {unreadNotificationsCount ? (
                <span className="topbar-icon-badge">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              ) : null}
            </button>

            {showNotifications ? (
              <div className="topbar-notification-panel">
                <div className="topbar-notification-header">
                  <div>
                    <strong>Notifications</strong>
                    <span>
                      {notifications.length
                        ? `${notifications.length} recent update${
                            notifications.length > 1 ? "s" : ""
                          }`
                        : "No updates yet"}
                    </span>
                  </div>
                </div>

                <div className="topbar-notification-list">
                  {notifications.length ? (
                    notifications.map((item) => (
                      <div key={item.id} className="topbar-notification-item">
                        <div
                          className={`topbar-notification-dot topbar-notification-dot-${getNotificationDotType(item)}`}
                        />
                        <div className="topbar-notification-copy">
                          <p>{item.message}</p>
                          <span>{formatNotificationTime(item.createdAt)}</span>
                        </div>
                        <button
                          type="button"
                          className="topbar-notification-remove"
                          aria-label="Delete notification"
                          onClick={() => deleteNotification(item.id)}
                        >
                          <i className="bx bx-x" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="topbar-notification-empty">
                      No notifications available right now.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="text-end me-3">
            <div className="fw-semibold" style={{ fontSize: "0.92rem", color: "#1f3550" }}>
              {user === "super_admin" ? "Super Admin" : "Studio Admin"}
            </div>
            <div className="text-muted" style={{ fontSize: "0.78rem" }}>
              Control Center
            </div>
          </div>

          <button
            type="button"
            className="btn p-0 border-0 bg-transparent shadow-none"
            onClick={() => setmodal(true)}
            style={{ lineHeight: 1 }}
            aria-label="Logout"
          >
            <i className="bx bx-power-off text-danger" style={{ fontSize: "1.55rem" }} />
          </button>
        </div>
      </div>

      <Modal
        show={modal}
        onHide={() => setmodal(false)}
        backdrop="static"
        keyboard={false}
        centered
        dialogClassName="logout-modal-dialog"
        contentClassName="logout-modal"
      >
        <div className="modal-header logout-modal-header">
          <div className="logout-modal-title-wrap">
            <div className="logout-modal-icon">
              <i className="bx bx-shield-quarter" />
            </div>
            <div>
              <h5 className="modal-title mb-0">Confirm Logout</h5>
              <small className="text-muted">Secure session exit</small>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={() => setmodal(false)} />
        </div>
        <div className="modal-body logout-modal-body">
          <p className="mb-0">You are about to sign out from the admin panel. Continue?</p>
        </div>
        <div className="modal-footer logout-modal-footer">
          <button
            type="button"
            className="btn logout-cancel-btn"
            onClick={() => setmodal(false)}
          >
            No
          </button>
          <button
            type="button"
            className="btn logout-confirm-btn"
            onClick={() => Logout()}
          >
            <i className="bx bx-power-off me-1" />
            Yes
          </button>
        </div>
      </Modal>
    </header>
  );
}

export default Header;
