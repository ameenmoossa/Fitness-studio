import { useEffect,  useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiCall } from "../../Services/ApiCall";

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];
const PIN_LENGTH = 4;

const AttendanceKiosk = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const resetTimerRef = useRef(null);
  const pinInputRef = useRef(null);

  // const classId = useMemo(() => {
  //   const params = new URLSearchParams(window.location.search);

  //   return (
  //     params.get("class_id") ||
  //     localStorage.getItem("kiosk_class_id") ||
  //     localStorage.getItem("selected_class_id") ||
  //     ""
  //   );
  // }, []);
const classId = "67d9a8c1f2ab34e67890abcd";
  useEffect(() => {
    pinInputRef.current?.focus();

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setPin("");
      setStatus("");
      setFeedback("");
      setLoading(false);
    }, 2200);
  };

  const updatePin = (nextValue) => {
    const numericValue = nextValue.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setPin(numericValue);

    if (status) {
      setStatus("");
      setFeedback("");
    }
  };

  const focusPinInput = () => {
    pinInputRef.current?.focus();
  };

  const handleKeypadPress = (key) => {
    if (loading) {
      return;
    }

    focusPinInput();

    if (key === "clear") {
      updatePin("");
      return;
    }

    if (key === "back") {
      updatePin(pin.slice(0, -1));
      return;
    }

    if (pin.length < PIN_LENGTH) {
      updatePin(`${pin}${key}`);
    }
  };

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    if (!classId) {
      setStatus("error");
      setFeedback("Add a class id to open this kiosk.");
      scheduleReset();
      return;
    }

    if (pin.length !== PIN_LENGTH) {
      setStatus("error");
      setFeedback("Please enter your 4-digit PIN.");
      scheduleReset();
      return;
    }

    setLoading(true);
    setStatus("");
    setFeedback("");

  const res = await ApiCall("post", "/attendance/verify-pin", {
  pin,
  class_id: classId,
});

    if (res.status) {
      setStatus("success");
      setFeedback("Attendance marked successfully.");
    } else {
      setStatus("error");
      setFeedback(
        typeof res.message === "string" ? res.message : "Invalid PIN. Please try again."
      );
    }

    setLoading(false);
    scheduleReset();
  };

  const handlePinKeyDown = (event) => {
    const allowedControlKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"];

    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
      return;
    }

    if (allowedControlKeys.includes(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rl");
    localStorage.removeItem("_id");
    localStorage.removeItem("kiosk_class_id");
    localStorage.removeItem("selected_class_id");
    navigate("/login", { state: { fromLogout: true } });
  };

  return (
    <div className="kiosk-page">
      <div className="kiosk-glow kiosk-glow-left" />
      <div className="kiosk-glow kiosk-glow-right" />

      <button
        type="button"
        className="kiosk-logout-btn"
        onClick={handleLogout}
      >
        <i className="mdi mdi-logout-variant" />
        Logout
      </button>

      <div className="kiosk-shell" onClick={focusPinInput}>
        <section className="kiosk-card kiosk-card-simple">
          <div className="kiosk-card-top kiosk-card-top-simple">
            <h2>Enter PIN</h2>
          </div>

          {!!feedback && (
            <div className={`kiosk-status kiosk-status-${status || "idle"}`}>
              <span>{feedback}</span>
            </div>
          )}

          <label htmlFor="kiosk-pin" className="kiosk-label">
            PIN
          </label>

          <div className="kiosk-pin-display" aria-hidden="true">
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
              <span
                key={index}
                className={pin[index] ? "is-filled" : ""}
              >
                {pin[index] ? "•" : ""}
              </span>
            ))}
          </div>

          <input
            ref={pinInputRef}
            id="kiosk-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={(event) => updatePin(event.target.value)}
            onKeyDown={handlePinKeyDown}
            onBlur={() => {
              window.requestAnimationFrame(() => {
                pinInputRef.current?.focus();
              });
            }}
            className="kiosk-pin-input"
            placeholder="Enter PIN"
          />

          <div className="kiosk-keypad">
            {KEYPAD_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={`kiosk-key ${
                  key === "clear" || key === "back" ? "kiosk-key-muted" : ""
                }`}
                onClick={() => handleKeypadPress(key)}
                disabled={loading}
              >
                {key === "clear" ? "Clear" : key === "back" ? "⌫" : key}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`kiosk-submit ${loading ? "is-loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Checking in..." : "Mark Attendance"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default AttendanceKiosk;
