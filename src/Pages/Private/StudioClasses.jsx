import { useContext, useEffect, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";
import { Form, Modal } from "react-bootstrap";
import { Show_Toast } from "../../utils/Toast";
import { ContextDatas } from "../../Services/Context";
import { base_url } from "../../Services/BaseUrl";
import { Helmet } from "react-helmet";
import moment from "moment";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import imageCompression from "browser-image-compression";

const CLASS_NAME_OPTIONS = ["Zumba", "Yoga", "HIIT", "Pilates"];



function StudioClasses() {
  const { Check_Validation, Logout } = useContext(ContextDatas);

  const [modal, setmodal] = useState(false);
  const [validated, setvalidated] = useState(false);
  const [pages, setpages] = useState({
    limit: 10,
    page: 1,
  });
  const [instructorlist, setinstructorlist] = useState([]);
  const [, setstudiolist] = useState([]);
  const [allclasses, setallclasses] = useState([]);
  const [pagination, setpagination] = useState({
    is_next: false,
    is_prev: false,
  });
  const [image, setimage] = useState();
  const [loading, setloading] = useState(false);
  const [classdata, setclassdata] = useState({
    studio_id: localStorage.getItem("_id") ? localStorage.getItem("_id") : ""
  });
  const [delete_confirm_modal, setdelete_confirm_modal] = useState({
    show: false,
    id: "",
  });


  useEffect(() => {
    if (localStorage.getItem("_id")) {
      getClasses();
    } else {
      Logout();
    }
  }, [pages.page]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    getClasses();
    getInstructorList();
    getStudio();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const Upload_Image = async (e) => {
    // console.log(e);
    // if (e.target.files[0]) {
    //   setimage(URL.createObjectURL(e.target.files[0]));
    //   setclassdata({ ...classdata, image: e.target.files[0] });
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
          // compress the file to max 1MB
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1080,
            useWebWorker: true,
          };

          const compressedFile = await imageCompression(e.target.files[0], options);

          setimage(URL.createObjectURL(compressedFile));
          setclassdata({ ...classdata, image: compressedFile });
        } catch (err) {
          Show_Toast("Image compression failed", false);
          e.target.value = "";
        }
        // setimage(URL.createObjectURL(e.target.files[0]));
        // setclassdata({ ...classdata, image: e.target.files[0] });
      } else {
        setimage("");
      }
    } else {
      Show_Toast("Only Images are Allowed", false);
      e.target.value = "";
    }
  };

  const getClasses = async () => {
    var response = await ApiCall(
      "post",
      "/classes/list",
      {
        studio_id: localStorage.getItem("_id")
          ? localStorage.getItem("_id")
          : null,
      },
      pages
    );
    if (response.status) {
      console.log("________________________________________________________");
      console.log(response.message.data.docs);
      setallclasses(response.message.data.docs);
      setpagination({
        ...pagination,
        is_next: response.message.data.hasNextPage,
        is_prev: response.message.data.hasPrevPage,
      });
    }
  };

  const getStudio = async () => {
    var response = await ApiCall(
      "get",
      "/studios/list",
      {},
      { select: "name" }
    );
    console.log("THE STUDIO DATA");

    if (response.status) {
      setstudiolist(response.message.docs);
    }
  };

  const Fun_Delete = async () => {
    var response = await ApiCall("delete", `/classes`, {
      id: delete_confirm_modal.id,
    });
    if (response.status) {
      getClasses();
      setdelete_confirm_modal({ show: false, id: "" });
      Show_Toast("Class Deleted Succesfully", true);
    }
  };

  const getInstructorList = async () => {
    var response = await ApiCall("get", "/instructors", {}, { select: "name" });
    console.log("THE Instructor DATA");
    console.log(response);
    if (response.status) {
      setinstructorlist(response.message.docs);
    }
  };

    const addClass = async () => {
    setloading(true);

    const datesToProcess = classdata.start_dates && classdata.start_dates.length > 0 
       ? classdata.start_dates 
       : [classdata.start_date_new];

    let anySuccess = false;

    for (let i = 0; i < datesToProcess.length; i++) {
        const d = datesToProcess[i];
        if (!d) continue;

        const payload = {
          ...classdata,
          start_date: moment.utc(moment(d)).format()
        };

        var response = await ApiCall(
          "post",
          "/classes",
          payload,
          {},
          "multipart/form-data"
        );
        
        if (response.status) {
           anySuccess = true;
        }
    }

    setloading(false);

    if (anySuccess) {
      setimage("");
      setclassdata({ studio_id: localStorage.getItem("_id") ? localStorage.getItem("_id") : "" });
      setmodal(false);
      setvalidated(false);
      getClasses();
      Show_Toast("Classes Added Succesfully", true);
    }
  };

  const onEditClicked = (value) => {
    console.log(value);
    setclassdata({
      ...classdata,
      name: value.name,
      price: value.price,
      capacity: value.capacity,
      studio_id: value.studio_id._id,
      instructor: value.instructor ? value.instructor._id : null,
      duration: value.duration,
      // start_date_new: moment(value.start_date).format("YYYY-MM-DD hh:mm"),
      start_date_new: value.start_date,
      // end_date: moment(value.end_date).format("YYYY-MM-DD"),
      description: value.description,
      id: value._id,
    });
    setimage(`${base_url}/${value.image}`);
    setmodal(true);
  };

  const updateClass = async () => {
    setloading(true);
    classdata.start_date = moment
      .utc(moment(classdata.start_date_new))
      .format();
    var response = await ApiCall(
      "put",
      "/classes",
      classdata,
      {},
      "multipart/form-data"
    );
    setloading(false);
    if (response.status) {
      setmodal(false);
      setimage("");
      setclassdata("");
      setvalidated(false);
      getClasses();
      Show_Toast("Class Updated Succesfully", true);
    }
  };

  const handleClose = () => {
    setimage("");
    setclassdata("");
    setvalidated(false);
    setmodal(false);
  };

  const handleChange = (e) => {
    setclassdata({ ...classdata, [e.target.name]: e.target.value });
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
                      <h4 className="card-title">Class List</h4>
                      <p className="card-title-desc"></p>
                    </div>
                    <div className="col-6" style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-primary waves-effect waves-light shadow-none"
                        onClick={() => {
                          setmodal(true)
                          setclassdata({...classdata,studio_id: localStorage.getItem("_id") ? localStorage.getItem("_id") : ""})
                        }}
                      >
                        <i className="bx bx-list-plus font-size-20 align-middle me-2"></i>{" "}
                        Add Class
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover table-bordered mb-0">
                      <thead>
                        <tr style={{ textAlign: "center" }}>
                          <th style={{ width: "30px" }}>#</th>
                          <th style={{ minWidth: "350px" }}>Details</th>
                          <th style={{ width: "170px" }}>Description</th>
                          <th style={{ width: "200px" }}>Counts</th>
                          <th style={{ width: "50px" }}>Image</th>
                          <th style={{ width: "30px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allclasses.length ? (
                          <>
                            {allclasses.map((value, key) => (
                              <tr key={key}>
                                <td>
                                  {pages.page === 1
                                    ? key + 1
                                    : pages.limit * (pages.page - 1) +
                                    (key + 1)}
                                </td>
                                <td>
                                  <div className="row">
                                    <div className="col-4">
                                      {" "}
                                      <b> Name </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7"> {value?.name} </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      {" "}
                                      <b> Capacity </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {" "}
                                      {value?.capacity}{" "}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      {" "}
                                      <b> Date&Time </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {" "}
                                      {moment(value?.start_date).format(
                                        "DD  MMMM  YYYY hh:mm A"
                                      )}{" "}
                                    </div>
                                  </div>
                                  {/* <div className="row">
                                    <div className="col-3">
                                      {" "}
                                      <b> End Date </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-8">
                                      {" "}
                                      {moment(value.end_date).format(
                                        "DD  MMMM  YYYY"
                                      )}{" "}
                                    </div>
                                  </div> */}
                                  <div className="row">
                                    <div className="col-4">
                                      {" "}
                                      <b> Duration </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {" "}
                                      {value.duration} Minutes{" "}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      {" "}
                                      <b> Instructor </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {" "}
                                      {value.instructor
                                        ? value.instructor.name
                                        : ""}{" "}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-4">
                                      {" "}
                                      <b> Studio </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-7">
                                      {" "}
                                      {value.studio_id
                                        ? value.studio_id.name
                                        : ""}{" "}
                                    </div>
                                  </div>
                                </td>
                                <td>{value.description}</td>
                                <td>
                                  <div className="row">
                                    <div className="col-6">
                                      {" "}
                                      <b> Booked </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-3">
                                      {" "}
                                      {value.booked_count}{" "}
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-6">
                                      {" "}
                                      <b> Waiting </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-3">
                                      {value.waitinglist_count}{" "}
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-6">
                                      {" "}
                                      <b> Average Rating </b>
                                    </div>
                                    <div className="col-1"> : </div>
                                    <div className="col-3">
                                      {" "}
                                      {value.average_rating}{" "}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <img
                                    src={`${base_url}/${value.image}`}
                                    style={{
                                      height: "100px",
                                      width: "100px",
                                      borderRadius: "10px",
                                    }}
                                  />
                                </td>
                                <td>
                                  <ul className="list-inline user-chat-nav text-end mb-2">
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

                                  <ul className="list-inline user-chat-nav text-end mb-0">
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
                              <b> No Classes Found </b>{" "}
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
        show={modal}
        backdrop="static"
        onHide={handleClose}
        size="lg"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Class</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body">
            <Form
              noValidate
              validated={validated}
              autoComplete="off"
              onSubmit={
                classdata?.id
                  ? (event) =>
                    Check_Validation(event, updateClass, setvalidated)
                  : (event) => Check_Validation(event, addClass, setvalidated)
              }
            >
              <div className="row">
                <div className="col-12 col-lg-4">
                  <div className="mb-3">
                    <label htmlFor="formrow-inputCity" className="form-label">
                      Class Name
                      {/* <sup style={{ color: "red", fontSize: "15px" }}>*</sup> */}
                    </label>
                    <select
                      name="name"
                      required
                      value={classdata?.name ? classdata.name : ""}
                      onChange={handleChange}
                      className="form-control"
                      id="formrow-inputCity"
                    >
                      <option value="">Select Class</option>
                      {CLASS_NAME_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Form.Control.Feedback type="invalid">
                      Please provide a Class Name
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-12 col-lg-4">
                  <div className="mb-3">
                    <label htmlFor="formrow-inputCity" className="form-label">
                      Slot ( Capacity Nos. )
                      {/* <sup style={{ color: "red", fontSize: "15px" }}>*</sup> */}
                    </label>
                    <input
                      pattern="[0-9]*"
                      required
                      min={0}
                      value={classdata?.capacity ? classdata.capacity : ""}
                      onChange={(e) =>
                        setclassdata({ ...classdata, capacity: e.target.value })
                      }
                      type="number"
                      className="form-control"
                      id="formrow-inputCity"
                      placeholder="Slots"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid Slot
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 col-lg-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-inputCity" className="form-label">
                      Instructor
                      {/* <sup style={{ color: "red", fontSize: "15px" }}>*</sup> */}
                    </label>
                    <select
                      className="form-control"
                      value={classdata?.instructor ? classdata.instructor : ""}
                      onChange={(e) =>
                        setclassdata({
                          ...classdata,
                          instructor: e.target.value,
                        })
                      }
                    >
                      <option value="" hidden defaultValue="">
                        {" "}
                        -- Choose Instructor (Optional) --
                      </option>
                      {instructorlist.length ? (
                        <>
                          {instructorlist.map((value, key) => (
                            <option value={value._id} key={key}>
                              {" "}
                              {value.name}{" "}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="" disabled>
                          {" "}
                          No Instructor Found{" "}
                        </option>
                      )}
                    </select>
                    <Form.Control.Feedback type="invalid">
                      Please provide a Instructor
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-inputCity" className="form-label">
                      Duration ( Minutes )
                      {/* <sup style={{ color: "red", fontSize: "15px" }}>*</sup> */}
                    </label>
                    <input
                      pattern="[0-9]+([\.,][0-9]+)?"
                      required
                      min={1}
                      max={1439}
                      value={classdata?.duration ? classdata.duration : ""}
                      onChange={(e) =>
                        setclassdata({ ...classdata, duration: e.target.value })
                      }
                      type="number"
                      className="form-control"
                      id="formrow-inputCity"
                      placeholder="Duration"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Valid Duration ( Max length 1439 )
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 col-lg-6">
                  <div className="mb-3 d-flex flex-column">
                    <label htmlFor="formrow-inputCity" className="form-label">
                      Date & Time
                      {/* <sup style={{ color: "red", fontSize: "15px" }}>*</sup> */}
                    </label>

                    {!classdata?.id ? (
                      <>
                        {(classdata?.start_dates || [null]).map((dateVal, index) => (
                          <div key={index} className="d-flex gap-2 mb-2">
                            <DatePicker
                              required
                              selected={dateVal instanceof Date || typeof dateVal === 'number' ? new Date(dateVal) : null}
                              onChange={(date) => {
                                const newDates = [...(classdata?.start_dates || [null])];
                                newDates[index] = date.getTime();
                                setclassdata({ ...classdata, start_dates: newDates });
                              }}
                              showTimeSelect
                              timeIntervals={30}
                              timeFormat="hh:mm aa"
                              dateFormat="yyyy-MM-dd hh:mm aa"
                              className="form-control"
                              minDate={new Date()}
                              placeholderText="Select Date & Time"
                            />
                            {index > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  const newDates = classdata.start_dates.filter((_, i) => i !== index);
                                  setclassdata({ ...classdata, start_dates: newDates });
                                }}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => {
                            const newDates = [...(classdata?.start_dates || [null]), null];
                            setclassdata({ ...classdata, start_dates: newDates });
                          }}
                        >
                          <i className="bx bx-plus me-1"></i> Add Another Time
                        </button>
                      </>
                    ) : (
                      <DatePicker
                        required
                        selected={
                          classdata?.start_date_new !== null && classdata?.start_date_new !== undefined
                            ? new Date(classdata?.start_date_new)
                            : null
                        }
                        onChange={(date) =>
                          setclassdata({
                            ...classdata,
                            start_date_new: date.getTime(),
                          })
                        }
                        showTimeSelect
                        timeIntervals={30}
                        timeFormat="hh:mm aa"
                        dateFormat="yyyy-MM-dd hh:mm aa"
                        className="form-control"
                        minDate={new Date()}
                        id="formrow-inputCity"
                        placeholderText="Select Date & Time"
                      />
                    )}

                    <Form.Control.Feedback type="invalid">
                      Please provide a Date and Time , Above This Time
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-inputCity" className="form-label">
                      Image
                      {/* <sup style={{ color: "red", fontSize: "15px" }}>*</sup> */}
                    </label>
                    <input
                      
                      type="file"
                      onChange={(e) => Upload_Image(e)}
                      className="form-control"
                      id="formrow-inputCity"
                      placeholder="Studio Name"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Image
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 col-lg-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-inputCity" className="form-label">
                      Description
                      {/* <sup style={{ color: "red", fontSize: "15px" }}>*</sup> */}
                    </label>
                    <textarea
                      value={classdata?.description ? classdata?.description : ""}
                      onChange={(e) =>
                        setclassdata({
                          ...classdata,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description (Optional)"
                      className="form-control"
                      rows={5}
                    ></textarea>
                    <Form.Control.Feedback type="invalid">
                      Please provide a Description
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="mb-3">
                    {image ? (
                      <div className="row mb-4">
                        <img
                          src={image}
                          style={{
                            borderRadius: "12px",
                            width: "250px",
                            height: "150px",
                            margin: "auto",
                            padding: "2px",
                          }}
                        />
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ float: "right" }}>
                  <button
                    type="button"
                    className="btn btn-dark waves-effect waves-light"
                  >
                    <i className="bx bx-loader bx-spin font-size-16 align-middle me-2"></i>{" "}
                    Loading
                  </button>
                </div>
              ) : (
                <div
                  className="d-flex flex-wrap gap-2"
                  style={{ float: "right" }}
                >
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn btn-danger w-md"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary w-md">
                    {classdata?.id ? "Update" : "Submit"}
                  </button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </Modal>

      {delete_confirm_modal.show && (
        <DeleteConfirmModal
          message="Do You want to Delete This Class ?"
          delete_modal={delete_confirm_modal}
          modal_toggle={() =>
            setdelete_confirm_modal({ show: false, id: null })
          }
          next_fun={Fun_Delete}
        />
      )}

      <Helmet>
        <title> Studio Classes </title>
      </Helmet>
    </div>
  );
}

export default StudioClasses;
