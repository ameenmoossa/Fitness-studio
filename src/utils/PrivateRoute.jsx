import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { ContextDatas } from "../Services/Context";
import PropTypes from "prop-types";

export { PrivateRoute };
function PrivateRoute({ children }) {
  const { user } = useContext(ContextDatas);
  const activeUser = user ?? localStorage.getItem("rl");

  if (!activeUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};


