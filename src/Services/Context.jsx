import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  getStoredNotifications,
  markAllNotificationsRead,
  removeNotification,
  subscribeToNotifications,
} from "../utils/notifications";

export const ContextDatas = createContext();

const Context = ({ children }) => {
  let navigate = useNavigate();

  const Logout = () => {
    localStorage.removeItem("rl");
    localStorage.removeItem("_id");
    setuser(null);
    return navigate("/login");
  };

  const [user, setuser] = useState(
    localStorage.getItem("rl") ? localStorage.getItem("rl") : null
  );
  const [notifications, setNotifications] = useState(getStoredNotifications());

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(setNotifications);
    setNotifications(getStoredNotifications());

    return unsubscribe;
  }, []);

  const Check_Validation = (event, fun_name, setstate) => {
    const form = event.currentTarget;
    event.preventDefault();

    setstate(true);
    if (form.checkValidity() === false) {
      event.stopPropagation();
      return false;
    } else {
      fun_name();
      return true;
    }
  };

  const markNotificationsRead = () => {
    setNotifications(markAllNotificationsRead());
  };

  const deleteNotification = (notificationId) => {
    setNotifications(removeNotification(notificationId));
  };

  return (
    <ContextDatas.Provider
      value={{
        Check_Validation,
        Logout,
        user,
        setuser,
        notifications,
        unreadNotificationsCount: notifications.filter((item) => !item.isRead).length,
        markNotificationsRead,
        deleteNotification,
      }}
    >
      {children}
    </ContextDatas.Provider>
  );
};

Context.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Context;
