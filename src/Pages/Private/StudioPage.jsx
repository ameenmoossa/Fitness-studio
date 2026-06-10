import { useContext, useEffect, useRef, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";
import { Form, Modal } from "react-bootstrap";
import { ContextDatas } from "../../Services/Context";

import { Helmet } from "react-helmet";
import { Show_Toast } from "../../utils/Toast";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import imageCompression from "browser-image-compression";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DEFAULT_IMAGE_PATH,
  getImageUrl,
} from "../../utils/uploadHelpers";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const createEmptyStudioData = () => ({
  name: "",
  image: null,
  city: "",
  latitude: "",
  longitude: "",
  mobile: "",
  status: true,
  user_name: "",
  username: "",
  password: "",
  description: "",
  studio_id: "",
  admin_id: "",
  start_time: "",
  close_time: "",
});

const parseStudioTime = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const twelveHourMatch = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]) % 12;
    const minutes = Number(twelveHourMatch[2]);

    if (twelveHourMatch[3].toUpperCase() === "PM") {
      hours += 12;
    }

    return new Date(1970, 0, 1, hours, minutes, 0, 0);
  }

  const twentyFourHourMatch = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (twentyFourHourMatch) {
    return new Date(
      1970,
      0,
      1,
      Number(twentyFourHourMatch[1]),
      Number(twentyFourHourMatch[2]),
      Number(twentyFourHourMatch[3] || 0),
      0
    );
  }

  return null;
};

const formatStudioTime = (value) => {
  const parsedTime = parseStudioTime(value);

  return parsedTime
    ? parsedTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "-";
};

function StudioPage() {
  const [modal, setmodal] = useState(false);
  const { Check_Validation } = useContext(ContextDatas);
  const [validated, setvalidated] = useState(false);
  const [studiodata, setstudiodata] = useState(createEmptyStudioData());
  const [studiolist, setstudiolist] = useState([]);
  const [confirm_password, setconfirm_password] = useState("");

  const [password_show, setpassword_show] = useState(false);
  const [cpassword_show, setcpassword_show] = useState(false);

  const [delete_confirm_modal, setdelete_confirm_modal] = useState({
    show: false,
    id: "",
  });
  const [pages, setpages] = useState({
    page: 1,
    limit: 10,
  });
  const [pagination, setpagination] = useState({
    is_next: false,
    is_prev: false,
  });
  const [loading, setloading] = useState(false);
  const [image, setimage] = useState();
  const [error] = useState("");
  const formRef = useRef(null);

  const resetStudioForm = ({ closeModal = false } = {}) => {
    setconfirm_password("");
    setstudiodata(createEmptyStudioData());
    setimage(null);
    setvalidated(false);
    setpassword_show(false);
    setcpassword_show(false);
    formRef.current?.reset();

    if (closeModal) {
      setmodal(false);
    }
  };

  const buildStudioPayload = (data, isCreate = false) => {
    const payload = {
      ...data,
      latitude:
        data?.latitude !== undefined && data?.latitude !== ""
          ? Number(data.latitude)
          : data?.latitude,
      longitude:
        data?.longitude !== undefined && data?.longitude !== ""
          ? Number(data.longitude)
          : data?.longitude,
    };

    if (isCreate) {
      payload.role = "studio_admin";
    }

    return payload;
  };

  const handleClose = () => {
    resetStudioForm({ closeModal: true });
  };


  useEffect(() => {
    getStudio();
  }, [pages.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStudio = async () => {
    var response = await ApiCall("get", "/studios/list", {}, pages);
    if (response.status) {
      setstudiolist(response.message.docs);
      setpagination({
        ...pagination,
        is_next: response.message.hasNextPage,
        is_prev: response.message.hasPrevPage,
      });
    }
  };

  const addStudio = async () => {
    if (studiodata.password != confirm_password) {
      Show_Toast("Confirm Passowrd Does Not Match", false);
    } else {
      const payload = buildStudioPayload(studiodata, true);

      setloading(true);
      var response = await ApiCall(
        "post",
        "/studios",
        payload,
        {},
        "multipart/form-data"
      );
      setloading(false);

      setvalidated(false);
      // console.log(response);
      if (response.status) {
        resetStudioForm({ closeModal: true });
        getStudio();
      }
    }
  };

  const onEditClicked = (value) => {
    // console.log("-------------------------------------------");
    setstudiodata({
      ...createEmptyStudioData(),
      name: value.name,
      image: value.image,
      city: value.city,
      latitude: value.location.coordinates[1],
      longitude: value.location.coordinates[0],
      mobile: value.studio_admin ? value.studio_admin.mobile : "",
      status: value.status,
      user_name: value.studio_admin ? value.studio_admin.user_detail.name : "",
      username: value.studio_admin ? value.studio_admin.username : "",
      password: value.studio_admin ? value.studio_admin.password : "",
      description: value.description,
      studio_id: value._id,
      admin_id: value.studio_admin ? value.studio_admin._id : "",
      start_time: value?.start_time ? value?.start_time : "",
      close_time: value?.close_time ? value?.close_time : "",
    });
    setconfirm_password(value.studio_admin ? value.studio_admin.password : "");
    setmodal(true);
    setimage(getImageUrl(value.image, DEFAULT_IMAGE_PATH));
  };

  const Fun_Delete = async () => {
    var response = await ApiCall(
      "delete",
      `/studios/${delete_confirm_modal.id}`
    );
    if (response.status) {
      getStudio();
      setdelete_confirm_modal({ show: false, id: "" });
    }
  };

  const updateStudio = async () => {
    if (studiodata.password != confirm_password) {
      Show_Toast("Confirm Passowrd Does Not Match", false);
    } else {
      const payload = buildStudioPayload(studiodata);
      setloading(true);
      var response = await ApiCall(
        "put",
        "/studios",
        payload,
        {},
        "multipart/form-data"
      );
      setloading(false);
      setvalidated(false);
      if (response.status) {
        resetStudioForm({ closeModal: true });
        getStudio();
      }
    }
  };

  const Upload_Image = async (e) => {
    // console.log(e);
    // if (e.target.files[0]) {
    //   setimage(URL.createObjectURL(e.target.files[0]));
    //   setinstructordata({ ...instructordata, image: e.target.files[0] });
    // } else {
    //   setimage("");
    // }

    var fileName = e.target.value;
    var idxDot = fileName.lastIndexOf(".") + 1;
    var extFile = fileName.substr(idxDot, fileName.length).toLowerCase();
    if (
      extFile == "jpg" ||
      extFile == "jpeg" ||
      extFile == "png" ||
      extFile == "webp"
    ) {
      if (e.target.files[0]) {
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1080,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(e.target.files[0], options);
          setimage(URL.createObjectURL(compressedFile))
          setstudiodata({ ...studiodata, image: compressedFile });
        } catch (err) {
          Show_Toast("Image compression failed", false);
          e.target.value = "";
        }
        // setimage(URL.createObjectURL(e.target.files[0]));
        // setstudiodata({ ...studiodata, image: e.target.files[0] });
      } else {
        setimage("");
      }
    } else {
      Show_Toast("Only Images are Allowed", false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-12">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <h4 className="card-title">Studio List</h4>
                      <p className="card-title-desc"></p>
                    </div>
                    <div className="col-6" style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-primary waves-effect waves-light shadow-none"
                        onClick={() => {
                          setmodal(true);
                          resetStudioForm();
                        }}
                      >
                        <i className="bx bx-list-plus font-size-20 align-middle me-2"></i>{" "}
                        Add Studio
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive" >
                    <table className="table table-hover table-bordered mb-0">
                      <thead>
                        <tr style={{ textAlign: "center" }}>
                          <th style={{ width: "30px" }}>#</th>
                          <th style={{ width: "300px" }}>Details</th>
                          <th style={{ maxWidth: "150px" }}>Description</th>
                          <th style={{ width: "350px" }}>User Credentials</th>
                          <th style={{ width: "150px" }}>Image</th>
                          <th style={{ width: "50px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studiolist.length ? (
                          <>
                            {studiolist.map((value, key) => (
                              <tr key={key}>
                                <td>
                                  {" "}
                                  {pages.page === 1
                                    ? key + 1
                                    : pages.limit * (pages.page - 1) +
                                    (key + 1)}
                                </td>
                                <td>
                                  <div className="row">
                                    <div className="col-4">
                                      <b>Name </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">{value?.name}</div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      <b>City </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">{value?.city}</div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      <b>Status </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value?.status
                                        ? "Available"
                                        : "Not Available"}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      <b>Latitude </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value?.location?.coordinates[1]}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      <b>Longitude </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value?.location?.coordinates[0]}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      <b>Time </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value?.start_time && value?.close_time && (
                                        <>
                                          {formatStudioTime(value.start_time)}
                                          {" – "}
                                          {formatStudioTime(value.close_time)}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ maxWidth: "170px" }} >{value.description}</td>
                                <td>
                                  <div className="row">
                                    <div className="col-4">
                                      <b> Username </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value?.studio_admin
                                        ? value.studio_admin.username
                                        : ""}
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-4">
                                      <b>Password </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value.studio_admin
                                        ? value.studio_admin.password
                                        : ""}
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-4">
                                      <b>Mobile </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value?.studio_admin
                                        ? value.studio_admin.mobile
                                        : ""}
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-4">
                                      <b>Name </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {value?.studio_admin
                                        ? value.studio_admin?.user_detail.name
                                        : ""}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <img
                                    src={getImageUrl(value?.image)}
                                    alt="studio Image"
                                    onError={(event) => {
                                      event.currentTarget.onerror = null;
                                      event.currentTarget.src = DEFAULT_IMAGE_PATH;
                                    }}
                                    style={{
                                      height: "100px",
                                      width: "100px",
                                      borderRadius: "10px",
                                    }}
                                  />
                                </td>
                                <td>
                                  <ul className="list-inline user-chat-nav text-center mb-2">
                                    <li
                                      className="list-inline-item"
                                      onClick={() => onEditClicked(value)}
                                    >
                                      <div className="dropdown">
                                        <button
                                          className="btn nav-btn"
                                          type="button"
                                          aria-haspopup="true"
                                          aria-expanded="false"
                                        >
                                          <i className="bx bx-add-to-queue" />
                                        </button>
                                      </div>
                                    </li>
                                  </ul>

                                  <ul className="list-inline user-chat-nav text-center mb-0">
                                    <li
                                      className="list-inline-item"
                                      onClick={() =>
                                        setdelete_confirm_modal({
                                          show: true,
                                          id: value._id,
                                        })
                                      }
                                    >
                                      <div className="dropdown">
                                        <button
                                          className="btn nav-btn"
                                          type="button"
                                          aria-haspopup="true"
                                          aria-expanded="false"
                                        >
                                          <i className="bx bx-trash" />
                                        </button>
                                      </div>
                                    </li>
                                  </ul>
                                </td>
                              </tr>
                            ))}
                          </>
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center" }}>
                              <b> No Studios Found </b>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!pagination.is_next && !pagination.is_prev ? (
                    ""
                  ) : (
                    <nav className="mt-4" style={{ float: "right" }}>
                      <ul className="pagination">
                        {pagination.is_prev ? (
                          <li
                            style={{ cursor: "pointer" }}
                            className={
                              pagination.is_prev
                                ? "page-item shadow-none"
                                : "page-item shadow-none disabled"
                            }
                            onClick={() =>
                              setpages({ ...pages, page: pages.page - 1 })
                            }
                          >
                            <span className="page-link">
                              <i className="mdi mdi-chevron-left"></i>Previous
                            </span>
                          </li>
                        ) : (
                          <li
                            style={{ cursor: "not-allowed" }}
                            className={
                              pagination.is_prev
                                ? "page-item shadow-none"
                                : "page-item shadow-none disabled"
                            }
                          >
                            <span className="page-link">
                              <i className="mdi mdi-chevron-left"></i>Previous
                            </span>
                          </li>
                        )}

                        {pagination.is_next ? (
                          <li
                            style={{ cursor: "pointer" }}
                            className={
                              pagination.is_next
                                ? "page-item shadow-none"
                                : "page-item shadow-none disabled"
                            }
                            onClick={() =>
                              setpages({ ...pages, page: pages.page + 1 })
                            }
                          >
                            <span className="page-link">
                              Next <i className="mdi mdi-chevron-right"></i>
                            </span>
                          </li>
                        ) : (
                          <li
                            style={{ cursor: "not-allowed" }}
                            className={
                              pagination.is_next
                                ? "page-item shadow-none"
                                : "page-item shadow-none disabled"
                            }
                          >
                            <span className="page-link">
                              Next <i className="mdi mdi-chevron-right"></i>
                            </span>
                          </li>
                        )}
                      </ul>
                    </nav>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>{" "}
      </div>



      <Modal
        centered
        backdrop="static"
        show={modal}
        onHide={handleClose}
        size="lg"
        dialogClassName="studio-form-dialog"
        className="studio-form-shell"
      >
        <div className="modal-content studio-form-modal studio-form-modal-v2">
          <div className="modal-header studio-form-header studio-form-header-v2">
            <div>
              <span className="studio-kicker">
                {studiodata.studio_id ? "Edit Mode" : "New Studio"}
              </span>
              <h5 className="modal-title">Studio Setup Console</h5>
              <p className="studio-form-subtitle mb-0">
                Configure location, schedule, admin access, and brand profile in one place.
              </p>
            </div>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body studio-form-body studio-form-body-v2">
            <Form
              ref={formRef}
              className="studio-form-grid studio-form-grid-v2"
              noValidate
              validated={validated}
              autoComplete="off"
              onSubmit={
                studiodata.studio_id
                  ? (event) =>
                      Check_Validation(event, updateStudio, setvalidated)
                  : (event) => Check_Validation(event, addStudio, setvalidated)
              }
            >
              <div className="studio-form-card-grid">
                <section className="studio-form-card">
                  <div className="studio-card-head">
                    <span>01</span>
                    <h6>Studio Identity</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-lg-6">
                      <label htmlFor="formrow-inputCity" className="form-label">
                        Studio Name
                      </label>
                      <input
                        required
                        autoComplete="off"
                        value={studiodata.name || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setstudiodata({ ...studiodata, name: value });
                        }}
                        type="text"
                        className={`form-control ${error ? "is-invalid" : ""}`}
                        id="formrow-inputCity"
                        placeholder="Studio Name"
                      />
                      {error ? (
                        <div className="invalid-feedback">{error}</div>
                      ) : (
                        <Form.Control.Feedback type="invalid">
                          Please provide a Studio Name
                        </Form.Control.Feedback>
                      )}
                    </div>
                    <div className="col-12 col-lg-6">
                      <label htmlFor="formrow-inputState" className="form-label">
                        City
                      </label>
                      <input
                        required
                        type="text"
                        value={studiodata.city ? studiodata.city : ""}
                        onChange={(e) =>
                          setstudiodata({ ...studiodata, city: e.target.value })
                        }
                        className="form-control"
                        id="formrow-inputState"
                        placeholder="City"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a City
                      </Form.Control.Feedback>
                    </div>
                    <div className="col-12">
                      <label htmlFor="studio-description" className="form-label">
                        Description
                      </label>
                      <textarea
                        id="studio-description"
                        className="form-control"
                        rows={4}
                        value={studiodata.description ? studiodata.description : ""}
                        onChange={(e) =>
                          setstudiodata({
                            ...studiodata,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your studio vibe, classes, and facilities"
                      ></textarea>
                      <Form.Control.Feedback type="invalid">
                        Please provide a Description
                      </Form.Control.Feedback>
                    </div>
                  </div>
                </section>

                <section className="studio-form-card">
                  <div className="studio-card-head">
                    <span>02</span>
                    <h6>Location and Operations</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-lg-4">
                      <label htmlFor="formrow-inputLatitude" className="form-label">
                        Latitude
                      </label>
                      <input
                        required
                        type="text"
                        value={studiodata.latitude || ""}
                        onChange={(e) =>
                          setstudiodata({
                            ...studiodata,
                            latitude: e.target.value,
                          })
                        }
                        className="form-control"
                        id="formrow-inputLatitude"
                        placeholder="Latitude"
                        minLength={1}
                        maxLength={8}
                        pattern="^-?(?:90(?:\.0{1,6})?|(?:[0-8]?\d)(?:\.\d{1,6})?)$"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a valid Latitude
                      </Form.Control.Feedback>
                    </div>
                    <div className="col-12 col-lg-4">
                      <label htmlFor="formrow-inputLongitude" className="form-label">
                        Longitude
                      </label>
                      <input
                        required
                        type="text"
                        value={studiodata.longitude || ""}
                        onChange={(e) =>
                          setstudiodata({
                            ...studiodata,
                            longitude: e.target.value,
                          })
                        }
                        className="form-control"
                        id="formrow-inputLongitude"
                        placeholder="Longitude"
                        minLength={1}
                        maxLength={9}
                        pattern="^-?(?:180(?:\.0{1,6})?|(?:1[0-7]\d|[1-9]?\d)(?:\.\d{1,6})?)$"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a valid Longitude
                      </Form.Control.Feedback>
                    </div>
                    <div className="col-12 col-lg-4">
                      <label htmlFor="studio-mobile" className="form-label">
                        Mobile
                      </label>
                      <PhoneInput
                        country={"in"}
                        value={studiodata.mobile || ""}
                        onChange={(phone) => setstudiodata({ ...studiodata, mobile: phone })}
                        inputClass="form-control"
                        containerClass="w-100"
                        inputProps={{
                          required: true,
                          placeholder: "Mobile",
                        }}
                        disableDropdown={false}
                        inputStyle={{ width: "100%" }}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide valid Mobile
                      </Form.Control.Feedback>
                    </div>
                    <div className="col-12 col-lg-6">
                      <label htmlFor="studio-open-time" className="form-label">
                        Open Time
                      </label>
                      <DatePicker
                        id="studio-open-time"
                        selected={parseStudioTime(studiodata?.start_time)}
                        onChange={(date) =>
                          setstudiodata({
                            ...studiodata,
                            start_time: date
                              ? date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "",
                          })
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={5}
                        timeFormat="hh:mm aa"
                        dateFormat="hh:mm aa"
                        className="form-control"
                        placeholderText="Select Time"
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <label htmlFor="studio-close-time" className="form-label">
                        Close Time
                      </label>
                      <DatePicker
                        id="studio-close-time"
                        selected={parseStudioTime(studiodata?.close_time)}
                        onChange={(date) =>
                          setstudiodata({
                            ...studiodata,
                            close_time: date
                              ? date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "",
                          })
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={5}
                        timeFormat="hh:mm aa"
                        dateFormat="hh:mm aa"
                        className="form-control"
                        placeholderText="Select Time"
                      />
                    </div>
                    <div className="col-12">
                      <div className="studio-availability-tile">
                        <div>
                          <p>Availability</p>
                          <span>
                            {studiodata.status
                              ? "Studio is live for bookings"
                              : "Studio is not available"}
                          </span>
                        </div>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input studio-status-switch"
                            checked={studiodata.status ? studiodata.status : false}
                            type="checkbox"
                            role="switch"
                            id="gridCheck"
                            onChange={() =>
                              setstudiodata({
                                ...studiodata,
                                status: !studiodata.status,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="studio-form-card">
                  <div className="studio-card-head">
                    <span>03</span>
                    <h6>Studio Admin Access</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-lg-4">
                      <label htmlFor="studio-staff-name" className="form-label">
                        Staff Name
                      </label>
                      <input
                        required
                        type="text"
                        maxLength={30}
                        value={studiodata.user_name ? studiodata.user_name : ""}
                        onChange={(e) =>
                          setstudiodata({
                            ...studiodata,
                            user_name: e.target.value,
                          })
                        }
                        className="form-control"
                        id="studio-staff-name"
                        placeholder="Staff Name"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a Staff Name
                      </Form.Control.Feedback>
                    </div>

                    <div className="col-12 col-lg-4">
                      <label htmlFor="studio-username" className="form-label">
                        Username
                      </label>
                      <input
                        autoComplete="off"
                        required
                        type="text"
                        minLength={3}
                        value={studiodata.username ? studiodata.username : ""}
                        onChange={(e) =>
                          setstudiodata({
                            ...studiodata,
                            username: e.target.value,
                          })
                        }
                        className="form-control"
                        id="studio-username"
                        placeholder="Username"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a Minimum 3 Letter Username
                      </Form.Control.Feedback>
                    </div>

                    <div className="col-12 col-lg-4">
                      <label htmlFor="studio-password" className="form-label">
                        Password
                      </label>
                      <div className="input-group auth-pass-inputgroup studio-password-group">
                        <input
                          required
                          autoComplete="new-password"
                          type={password_show ? "text" : "password"}
                          minLength={5}
                          value={studiodata.password ? studiodata.password : ""}
                          onChange={(e) =>
                            setstudiodata({
                              ...studiodata,
                              password: e.target.value,
                            })
                          }
                          className="form-control shadow-none"
                          id="studio-password"
                          placeholder="Enter password"
                          aria-label="Password"
                          aria-describedby="studio-password-addon"
                        />

                        <button
                          className="btn shadow-none studio-icon-btn"
                          type="button"
                          id="studio-password-addon"
                          onClick={() => setpassword_show(!password_show)}
                        >
                          {password_show ? (
                            <i className="mdi mdi-eye-off-outline" />
                          ) : (
                            <i className="mdi mdi-eye-outline" />
                          )}
                        </button>

                        <Form.Control.Feedback type="invalid">
                          Please provide a minimum 5 digit Password
                        </Form.Control.Feedback>
                      </div>
                    </div>

                    <div className="col-12 col-lg-6">
                      <label htmlFor="studio-confirm-password" className="form-label">
                        Confirm Password
                      </label>
                      <div className="input-group auth-pass-inputgroup studio-password-group">
                        <input
                          required
                          autoComplete="new-password"
                          type={cpassword_show ? "text" : "password"}
                          value={confirm_password}
                          onChange={(e) => setconfirm_password(e.target.value)}
                          className="form-control shadow-none"
                          id="studio-confirm-password"
                          placeholder="Enter confirm password"
                          aria-label="Password"
                          aria-describedby="studio-confirm-password-addon"
                        />

                        <button
                          className="btn shadow-none studio-icon-btn"
                          type="button"
                          id="studio-confirm-password-addon"
                          onClick={() => setcpassword_show(!cpassword_show)}
                        >
                          {cpassword_show ? (
                            <i className="mdi mdi-eye-off-outline" />
                          ) : (
                            <i className="mdi mdi-eye-outline" />
                          )}
                        </button>

                        <Form.Control.Feedback type="invalid">
                          Invalid Password
                        </Form.Control.Feedback>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="studio-form-card studio-form-card-media">
                  <div className="studio-card-head">
                    <span>04</span>
                    <h6>Branding and Image</h6>
                  </div>
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-lg-6">
                      <label htmlFor="formrow-email-input" className="form-label">
                        Upload Image
                      </label>
                      <input
                        required={studiodata.image ? false : true}
                        className="form-control"
                        type="file"
                        id="formrow-email-input"
                        accept="image/png,image/jpeg"
                        onChange={(e) => Upload_Image(e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a Image
                      </Form.Control.Feedback>
                    </div>
                    <div className="col-12 col-lg-6">
                      <img
                        src={image || DEFAULT_IMAGE_PATH}
                        alt="Studio preview"
                        className="studio-image-preview"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_IMAGE_PATH;
                        }}
                      />
                    </div>
                  </div>
                </section>
              </div>

              {loading ? (
                <div className="studio-form-actions mt-2">
                  <button
                    type="button"
                    className="btn studio-btn-loading waves-effect waves-light"
                  >
                    <i className="bx bx-loader bx-spin font-size-16 align-middle me-2"></i>{" "}
                    Saving Studio
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-2 studio-form-actions studio-form-footer">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn studio-btn-cancel w-md"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn studio-btn-submit w-md">
                    {studiodata.studio_id ? "Update Studio" : "Create Studio"}
                  </button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </Modal>

      {delete_confirm_modal.show && (
        <DeleteConfirmModal
          message="Do You want to Delete This Studio ?"
          delete_modal={delete_confirm_modal}
          modal_toggle={() =>
            setdelete_confirm_modal({ show: false, id: null })
          }
          next_fun={Fun_Delete}
        />
      )}

      <Helmet>
        <title> Studios </title>
      </Helmet>
    </div>
  );
}

export default StudioPage;
