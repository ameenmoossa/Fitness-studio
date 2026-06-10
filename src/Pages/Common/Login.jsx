



import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Form } from "react-bootstrap";
import { ContextDatas } from "../../Services/Context";
import { ApiCall } from "../../Services/ApiCall";
import { useLocation, useNavigate } from "react-router-dom";
import { Show_Toast } from "../../utils/Toast";

const normalizeAuthPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidates = [
    payload?.data,
    payload?.message?.data,
    payload?.message,
    payload?.user,
    payload,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate?.role) {
      return candidate;
    }

    if (candidate?.data?.role) {
      return candidate.data;
    }

    if (candidate?.user?.role) {
      return candidate.user;
    }
  }

  return null;
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { Check_Validation, setuser } = useContext(ContextDatas);
  const [validated, setValidated] = useState(false);
  const [userdata, setuserdata] = useState({
    username: "",
    password: "",
  });
  const [loading, setloading] = useState(false);
  const [show_password, setshow_password] = useState(false);
  const [entering, setEntering] = useState(false);
  const [logoutEntering, setLogoutEntering] = useState(false);

  useEffect(() => {
    if (location?.state?.fromLogout) {
      setLogoutEntering(true);
      const timer = window.setTimeout(() => {
        setLogoutEntering(false);
        navigate(location.pathname, { replace: true, state: {} });
      }, 1300);

      return () => window.clearTimeout(timer);
    }
  }, [location.pathname, location.state, navigate]);

  const Login = async () => {
    const startTime = Date.now();
    setloading(true);

    // ✅ FIXED PAYLOAD (ADDED ROLE)
    const loginPayload = {
      ...userdata,
      email: userdata.username,
      // role: "super_admin", // 🔥 IMPORTANT FIX
    };

    const response = await ApiCall("post", "/users/login", loginPayload);

    const elapsed = Date.now() - startTime;
    const minAnimationTime = 1400;

    if (elapsed < minAnimationTime) {
      await new Promise((resolve) =>
        setTimeout(resolve, minAnimationTime - elapsed)
      );
    }

    if (response.status) {
      const authData = normalizeAuthPayload(response.message);
      const loggedInUser =
        response?.data?.data ||
        response?.data ||
        response?.message?.data ||
        response?.message?.user ||
        authData;
      const role = authData?.role;
      const studioId =
        authData?.details?.studio_id?._id ??
        authData?.studio_id?._id ??
        authData?.studio_id;

      if (!role) {
        setEntering(false);
        setloading(false);
        setValidated(false);
        Show_Toast("Login response is missing the user role.", false);
        return;
      }

      setEntering(true);
      await new Promise((resolve) => setTimeout(resolve, 550));

      if (loggedInUser && typeof loggedInUser === "object") {
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        if (loggedInUser?._id) {
          localStorage.setItem("_id", loggedInUser._id);
        }
      }

      localStorage.setItem("rl", role);
      setuser(role);

      setuserdata({
        username: "",
        password: "",
      });

 localStorage.setItem("rl", role);
setuser(role);

if (role === "super_admin") {
  return navigate("/");
} 
else if (role === "studio_admin") {
  if (studioId) {
    localStorage.setItem("_id", studioId);
  }
  return navigate("/studioclasses");
} 
else if (role === "kiosk") {
  return navigate("/kiosk");
} 
else {
  localStorage.removeItem("rl");
  localStorage.removeItem("_id");
  window.location.reload();
}
    }

    setEntering(false);
    setloading(false);
    setValidated(false);
  };

  return (
    <div className="login-prism-page">
      <div className="login-prism-glow login-prism-glow-a" />
      <div className="login-prism-glow login-prism-glow-b" />

      <div
        className={`login-prism-shell ${entering ? "is-entering" : ""} ${
          logoutEntering ? "is-logout-entering" : ""
        }`}
      >
        <div className="login-prism-brand">
          <div className="login-prism-brand-logo">
            <img src="/assets/images/logo1.png" alt="Fitness Studio" />
          </div>
          <h2>Fitness Studio Admin</h2>
          <p>
            Manage classes, studios, instructors, and bookings from one polished
            control center.
          </p>
          <div className="login-prism-metric-grid">
            <div>
              <strong>Classes</strong>
              <span>Live scheduling</span>
            </div>
            <div>
              <strong>Studios</strong>
              <span>Multi-branch ready</span>
            </div>
            <div>
              <strong>Bookings</strong>
              <span>Fast operations</span>
            </div>
          </div>
        </div>

        <div className="login-prism-form-panel">
          <div className="login-prism-head">
            <span className="login-prism-chip">Secure Login</span>
            <div className="login-prism-form-brand">
              <div>
                <h4>Welcome Back</h4>
                <p>Sign in to continue to your admin workspace.</p>
              </div>
              <div className="login-prism-form-logo">
                <img src="/assets/images/logo1.png" alt="Fitness Studio" />
              </div>
            </div>
          </div>

          <Form
            noValidate
            validated={validated}
            autoComplete="off"
            onSubmit={(event) =>
              Check_Validation(event, Login, setValidated)
            }
            className="form-horizontal"
          >
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="login-prism-input-wrap">
                <i className="mdi mdi-account-outline" />
                <input
                  id="username"
                  type="text"
                  required
                  className="form-control shadow-none"
                  value={userdata.username}
                  onChange={(e) =>
                    setuserdata({
                      ...userdata,
                      username: e.target.value,
                    })
                  }
                  placeholder="Enter username"
                />
              </div>
              <Form.Control.Feedback type="invalid">
                Please provide a Username
              </Form.Control.Feedback>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <div className="input-group auth-pass-inputgroup login-prism-password-group">
                <span className="login-prism-pass-icon">
                  <i className="mdi mdi-lock-outline" />
                </span>
                <input
                  type={show_password ? "text" : "password"}
                  value={userdata.password}
                  onChange={(e) =>
                    setuserdata({
                      ...userdata,
                      password: e.target.value,
                    })
                  }
                  required
                  className="form-control shadow-none"
                  placeholder="Enter password"
                />
                <button
                  className="btn shadow-none"
                  type="button"
                  onClick={() => setshow_password(!show_password)}
                >
                  {show_password ? (
                    <i className="mdi mdi-eye-off-outline" />
                  ) : (
                    <i className="mdi mdi-eye-outline" />
                  )}
                </button>
                <Form.Control.Feedback type="invalid">
                  Please provide a Password
                </Form.Control.Feedback>
              </div>
            </div>

            <div className="d-grid">
              <button
                className={`btn login-prism-btn ${
                  loading ? "is-loading" : ""
                }`}
                type="submit"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Log In"}
              </button>
            </div>
          </Form>
        </div>

        {loading && (
          <div className="login-prism-loading">
            <div>
              <div className="login-prism-loader">
                <div className="login-prism-dumbbell" aria-hidden="true">
                  <span className="plate plate-left plate-outer" />
                  <span className="plate plate-left plate-inner" />
                  <span className="bar" />
                  <span className="plate plate-right plate-inner" />
                  <span className="plate plate-right plate-outer" />
                </div>
              </div>
              <p>Entering your admin workspace...</p>
            </div>
          </div>
        )}
      </div>

      <Helmet>
        <title>Login</title>
      </Helmet>
    </div>
  );
}

export default Login;
