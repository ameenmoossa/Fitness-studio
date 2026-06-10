import { useContext, useEffect, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";
import { Form, Modal } from "react-bootstrap";
import { Show_Toast } from "../../utils/Toast";
import { ContextDatas } from "../../Services/Context";

import { Helmet } from "react-helmet";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import { useNavigate } from "react-router-dom";
import { currency } from "../../constants/constants";

const getPlanSortTimestamp = (value) => {
  const timestamp = new Date(
    value?.createdAt || value?.created_at || value?.updatedAt || 0
  ).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function PlanPage() {
  const { Check_Validation } = useContext(ContextDatas);

  let navigate = useNavigate();

  const [modal, setmodal] = useState(false);
  const [first_modal, setfirst_modal] = useState(false);
  const [validated, setvalidated] = useState(false);
  const [pages, setpages] = useState({
    limit: 10,
    page: 1,
  });
  const [plandata, setplandata] = useState("");
  const [allplans, setallplans] = useState([]);
  const [pagination, setpagination] = useState({
    is_next: false,
    is_prev: false,
  });

  const [loading, setloading] = useState(false);
  const [delete_confirm_modal, setdelete_confirm_modal] = useState({
    show: false,
    id: "",
  });


  useEffect(() => {
    getPlans();
  }, [pages.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPlans = async () => {
    var response = await ApiCall("post", "/plans/list", { type: "" }, pages);
    console.log("---------------------------------------------------");
    console.log(response);
    if (response.status) {
      const sortedPlans = [...(response.message.data.docs || [])].sort(
        (firstPlan, secondPlan) =>
          getPlanSortTimestamp(secondPlan) - getPlanSortTimestamp(firstPlan)
      );

      setallplans(sortedPlans);
      setpagination({
        ...pagination,
        is_next: response.message.data.hasNextPage,
        is_prev: response.message.data.hasPrevPage,
      });
      if (!sortedPlans.length) {
        setfirst_modal(true);
        setplandata({
          ...plandata,
          name: "Free",
          price: "0",
          validity: "7",
          type: "credit",
          class_limit: "3",
          is_free: true,
        });
      }
    } else {
      Show_Toast("Something Went Wrong , Please Try Again ...");
    }
  };

  const addPlan = async () => {
    setloading(true);
    var response = await ApiCall("post", "/plans", plandata);
    setloading(false);
    if (response.status) {
      setmodal(false);
      setplandata("");
      setvalidated(false);
      getPlans();
      setfirst_modal(false);
    }
  };

  const onEditIconClicked = (value) => {

    value["id"] = value._id;
    console.log(value);
    if (value.is_free) {
      setplandata(value);
      setfirst_modal(true);
    } else {
      setplandata(value);
      setmodal(true);
    }
  };

  const updatePlan = async () => {
    setloading(true);
    if (plandata.type === "subscription") {
      plandata.class_limit = 0;
    }
    var response = await ApiCall("put", "/plans", plandata);
    setloading(false);
    if (response.status) {
      setmodal(false);
      setplandata("");
      getPlans();
      setfirst_modal(false);
      setvalidated(false);
    }
  };

  const Fun_Delete = async () => {
    var response = await ApiCall("delete", `/plans`, {
      id: delete_confirm_modal.id,
    });
    if (response.status) {
      getPlans();
      setdelete_confirm_modal({ show: false, id: "" });
    }
  };

  const handleClose = () => {
    setmodal(false);
    setfirst_modal(false);
    setplandata("");
    setvalidated(false);
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
                      <h4 className="card-title">Plan List</h4>
                      <p className="card-title-desc"></p>
                    </div>
                    <div className="col-6" style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-primary waves-effect waves-light shadow-none"
                        onClick={() => setmodal(true)}
                      >
                        <i className="bx bx-list-plus font-size-20 align-middle me-2"></i>{" "}
                        Add Plan
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12 col-md-12">
                      <div className="table-responsive">
                        <table className="table table-hover table-bordered mb-0">
                          <thead>
                            <tr style={{ textAlign: "center" }}>
                              <th style={{ width: "20px" }}>#</th>
                              <th>Name</th>
                              <th>Price</th>
                              <th>Type</th>
                              <th>Limit</th>
                              <th>Validity</th>
                              <th style={{ width: "130px" }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allplans.length ? (
                              <>
                                {allplans.map((value, key) => (
                                  <tr key={key}>
                                    <td>
                                      {pages.page === 1
                                        ? key + 1
                                        : pages.limit * (pages.page - 1) +
                                          (key + 1)}
                                    </td>

                                    <td>{value.name}</td>
                                    <td>
                                      <b>{value.price} </b> {currency}
                                    </td>
                                    <td>
                                      {value.type === "subscription" ? (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-primary shadow-none"
                                        >
                                          Subscription
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-success shadow-none"
                                        >
                                          Credit
                                        </button>
                                      )}
                                    </td>
                                    <td>
                                      {value.type === "subscription" ? (
                                        <b>Unlimited</b>
                                      ) : (
                                        <b>{value.class_limit}</b>
                                      )}{" "}
                                      Classes
                                    </td>
                                    <td>
                                      <b>{value.validity}</b> Days
                                    </td>

                                    <td>
                                      <div className="row">
                                        <div className="col-6">
                                          <ul className="list-inline user-chat-nav text-center mb-2">
                                            <li
                                              className="list-inline-item"
                                              onClick={() =>
                                                onEditIconClicked(value)
                                              }
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
                                        </div>
                                        <div className="col-6">
                                          {value.is_free ? (
                                            ""
                                          ) : (
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
                                          )}
                                        </div>
                                      </div>
                                      {/* <ul className="list-inline user-chat-nav text-center mb-2">
                                        <li
                                          className="list-inline-item"
                                          onClick={() =>
                                            onEditIconClicked(value)
                                          }
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

                                      {value.is_free ? (
                                        ""
                                      ) : (
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
                                      )} */}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            ) : (
                              <tr>
                                <td colSpan={5} style={{ textAlign: "center" }}>
                                  <b> No Instructors Found </b>{" "}
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
                                  <i className="mdi mdi-chevron-left"></i>
                                  Previous
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
                                  <i className="mdi mdi-chevron-left"></i>
                                  Previous
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
            </div>
          </div>
        </div>{" "}
      </div>

      <Modal
        centered
        show={modal}
        backdrop="static"
        onHide={handleClose}
        size="md"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Plan</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body">
            <Form
              noValidate
              validated={validated}
              autoComplete="off"
              onSubmit={
                plandata.id
                  ? (event) => Check_Validation(event, updatePlan, setvalidated)
                  : (event) => Check_Validation(event, addPlan, setvalidated)
              }
            >
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Name
                    </label>
                    <input
                      required
                      type="text"
                      value={plandata.name ? plandata.name : ""}
                      onChange={(e) =>
                        setplandata({ ...plandata, name: e.target.value })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter a Name"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Name
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Price
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      pattern="[0-9]*"
                      value={plandata.price ? plandata.price : ""}
                      onChange={(e) =>
                        setplandata({ ...plandata, price: e.target.value })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter a Price"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Valid Price
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Validity ( In Days )
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      pattern="[0-9]*"
                      value={plandata.validity ? plandata.validity : ""}
                      onChange={(e) =>
                        setplandata({ ...plandata, validity: e.target.value })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter Validity Days"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid Validity
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Type
                    </label>
                    <select
                      className="form-control"
                      required
                      value={plandata.type ? plandata.type : ""}
                      onChange={(e) =>
                        setplandata({ ...plandata, type: e.target.value })
                      }
                    >
                      <option value="" hidden defaultValue="">
                        -- Choose Type --
                      </option>
                      <option value="subscription">Subscription</option>
                      <option value="credit">Credit</option>
                    </select>
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid Type
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              {plandata.type && plandata.type === "credit" ? (
                <>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label
                          htmlFor="formrow-email-input"
                          className="form-label"
                        >
                          Class Limit ( Nos. )
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          pattern="[0-9]*"
                          value={
                            plandata.class_limit ? plandata.class_limit : ""
                          }
                          onChange={(e) =>
                            setplandata({
                              ...plandata,
                              class_limit: e.target.value,
                            })
                          }
                          className="form-control"
                          id="formrow-email-input"
                          placeholder="Enter Class Limit"
                        />
                        <Form.Control.Feedback type="invalid">
                          Please provide a valid Limit
                        </Form.Control.Feedback>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                ""
              )}

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
                    {plandata.id ? "Update" : "Submit"}
                  </button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </Modal>

      <Modal
        centered
        show={first_modal}
        backdrop="static"
        onHide={handleClose}
        size="md"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Plan</h5>
            {allplans.length ? (
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
              />
            ) : (
              <button
                type="button"
                className="btn btn-primary waves-effect waves-light shadow-none"
                onClick={() => navigate(-1)}
              >
                {" "}
                Go Back
              </button>
            )}
          </div>
          <div className="modal-body">
            <Form
              noValidate
              validated={validated}
              autoComplete="off"
              onSubmit={
                plandata.id
                  ? (event) => Check_Validation(event, updatePlan, setvalidated)
                  : (event) => Check_Validation(event, addPlan, setvalidated)
              }
            >
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Name
                    </label>
                    <input
                      required
                      disabled
                      type="text"
                      value={plandata.name ? plandata.name : ""}
                      onChange={(e) =>
                        setplandata({ ...plandata, name: e.target.value })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter Your Email ID"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Valid Name
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Price
                    </label>
                    <input
                      required
                      disabled
                      type="number"
                      min={1}
                      value={plandata.price ? plandata.price : "0"}
                      onChange={(e) =>
                        setplandata({ ...plandata, price: e.target.value })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter Your Email ID"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Valid Price
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Validity
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={plandata.validity ? plandata.validity : ""}
                      onChange={(e) =>
                        setplandata({ ...plandata, validity: e.target.value })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter Your Email ID"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Validity
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Type
                    </label>
                    <select
                      className="form-control"
                      disabled
                      required
                      value={plandata.type ? plandata.type : ""}
                      onChange={(e) =>
                        setplandata({ ...plandata, type: e.target.value })
                      }
                    >
                      <option value="" hidden defaultValue="">
                        -- Choose Type --
                      </option>
                      <option value="subscription">Subscription</option>
                      <option value="credit">Credit</option>
                    </select>
                    <Form.Control.Feedback type="invalid">
                      Please provide a Type
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              {plandata.type && plandata.type === "credit" ? (
                <>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label
                          htmlFor="formrow-email-input"
                          className="form-label"
                        >
                          Class Limit
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          value={
                            plandata.class_limit ? plandata.class_limit : ""
                          }
                          onChange={(e) =>
                            setplandata({
                              ...plandata,
                              class_limit: e.target.value,
                            })
                          }
                          className="form-control"
                          id="formrow-email-input"
                          placeholder="Enter Your Email ID"
                        />
                        <Form.Control.Feedback type="invalid">
                          Please provide a Class Limit
                        </Form.Control.Feedback>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                ""
              )}

              <div
                className="d-flex flex-wrap gap-2"
                style={{ float: "right" }}
              >
                <button type="submit" className="btn btn-primary w-md">
                  {plandata.id ? "Update" : "Submit"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {delete_confirm_modal.show && (
        <DeleteConfirmModal
          message="Do You want to Delete This Plan ?"
          delete_modal={delete_confirm_modal}
          modal_toggle={() =>
            setdelete_confirm_modal({ show: false, id: null })
          }
          next_fun={Fun_Delete}
        />
      )}

      <Helmet>
        <title> Plans </title>
      </Helmet>
    </div>
  );
}

export default PlanPage;
