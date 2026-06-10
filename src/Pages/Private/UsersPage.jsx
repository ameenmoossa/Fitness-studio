import { useEffect, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";
import moment from "moment";
import { Form, Modal } from "react-bootstrap";
import { useContext } from "react";
import { ContextDatas } from "../../Services/Context";
import { Show_Toast } from "../../utils/Toast";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";

import { Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const getAccessFieldName = (value) => {
  if (value && typeof value === "object") {
    if (Object.prototype.hasOwnProperty.call(value, "isActive")) {
      return "isActive";
    }

    if (Object.prototype.hasOwnProperty.call(value, "status")) {
      return "status";
    }

    if (Object.prototype.hasOwnProperty.call(value, "access")) {
      return "access";
    }
  }

  return "isActive";
};

const getResolvedAccessValue = (value) => {
  const rawValue = value?.isActive ?? value?.status ?? value?.access;

  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  if (typeof rawValue === "number") {
    return rawValue === 1;
  }

  if (typeof rawValue === "string") {
    const normalizedValue = rawValue.trim().toLowerCase();

    return ["true", "1", "active", "enabled"].includes(normalizedValue);
  }

  return false;
};

const getToggledAccessPayload = (value, nextStatus) => {
  const accessField = getAccessFieldName(value);
  const currentValue = value?.[accessField];

  if (typeof currentValue === "string") {
    const normalizedValue = currentValue.trim().toLowerCase();

    if (["active", "inactive"].includes(normalizedValue)) {
      return { [accessField]: nextStatus ? "active" : "inactive" };
    }

    if (["enabled", "disabled"].includes(normalizedValue)) {
      return { [accessField]: nextStatus ? "enabled" : "disabled" };
    }

    if (["1", "0"].includes(normalizedValue)) {
      return { [accessField]: nextStatus ? "1" : "0" };
    }

    return { [accessField]: nextStatus ? "true" : "false" };
  }

  if (typeof currentValue === "number") {
    return { [accessField]: nextStatus ? 1 : 0 };
  }

  return { [accessField]: nextStatus };
};

const normalizeUserRecord = (value) => ({
  ...value,
  isActive: getResolvedAccessValue(value),
});

function UsersPage() {
  const [user_details, setuser_details] = useState([]);
  const [pages, setpages] = useState({
    page: 1,
    limit: 10,
    role: "customer",
    query: ""
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [modal, setmodal] = useState(false);
  const [validated, setvalidated] = useState(false);
  const [loading, setloading] = useState(false);
  const [userData, setUserData] = useState({
    role: "customer"
  });
  const [delete_confirm_modal, setdelete_confirm_modal] = useState({
    show: false,
    id: "",
  });
  const { Check_Validation } = useContext(ContextDatas);


  const [is_next, setis_next] = useState(false);


  useEffect(() => {
    getUsers();
  }, [pages.page, pages.query]); // eslint-disable-line react-hooks/exhaustive-deps

  // useEffect(() => {
  //   const delayDebounce = setTimeout(() => {
  //     getUsers();
  //   }, 50); // 500ms delay

  //   return () => clearTimeout(delayDebounce);
  // }, [pages.page, pages.query]); // eslint-disable-line react-hooks/exhaustive-deps

  const getUsers = async () => {
    var response = await ApiCall("get", "/users/list", {}, pages);
    if (response.status) {
      const docs = Array.isArray(response?.message?.docs)
        ? response.message.docs.map(normalizeUserRecord)
        : [];

      setuser_details(docs);
      setis_next(response.message.hasNextPage);
    }
  };

  const Fun_Delete = async () => {
    var response = await ApiCall("delete", `/users`, { user: delete_confirm_modal?.id });
    if (response.status) {
      getUsers();
      setdelete_confirm_modal({ show: false, id: "" });
    }
  };

  const onEditClicked = (value) => {
    setUserData({
      ...userData,
      name: value?.user_detail?.name,
      email: value?.email,
      mobile: value?.mobile,
      user_id: value._id,
      role: value?.role,
      gender: value?.user_detail?.gender
    });
    setmodal(true);
  };

  const addUser = async () => {
    setloading(true);
    var response = await ApiCall(
      "post",
      "/users",
      userData,
      {},
    );
    setloading(false);

    if (response.status) {
      setUserData("");
      setmodal(false);
      setvalidated(false);
      getUsers();
    }
  }

  const updateUser = async () => {
    setloading(true);
    var response = await ApiCall(
      "put",
      `/users/${userData?.role}`,
      userData,
      {},
    );
    setloading(false);
    if (response.status) {
      setmodal(false);
      setUserData("");
      setvalidated(false);
      getUsers();
    }
  };

  const handleClose = () => {
    setUserData("");
    setvalidated(false);
    setmodal(false);
  };

  // const changeStatus = async (e, value) => {
  //   const data = {
  //     isActive: e.target.checked,
  //     user_id: value._id
  //   }
  //   setloading(true);
  //   var response = await ApiCall(
  //     "put",
  //     `/users/${value?.role}`,
  //     data,
  //     {},
  //   );
  //   setloading(false);
  //   if (response.status) {
  //     const array=[...user_details]
  //     array
  //     await getUsers();
  //     setmodal(false);
  //     setUserData("");
  //     setvalidated(false);

  //     Show_Toast("User Status Updated Succesfully", true);
  //   }
  // }
  const changeStatus = async (e, value) => {
    const newStatus = e.target.checked;

    setloading(true);
    try {
      const response = await ApiCall("put", `/users/${value?.role}`, {
        ...getToggledAccessPayload(value, newStatus),
        user_id: value._id
      });

      if (response.status) {
        await getUsers();
      } else {
        Show_Toast("Failed to update status", false);
      }
    } catch (error) {
      console.error(error);
    }
    setloading(false);

    setmodal(false);
    setUserData("");
    setvalidated(false);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig.key) return user_details;

    const sorted = [...user_details].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'joinedDate') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }

      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  };



  return (
    <>
      <div>
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-xl-12">
                <div className="card users-page-shell">
                  <div className="card-body users-page-body">
                    <div className="users-page-hero">
                      <div>
                        <h4 className="card-title mb-1">Users Control Room</h4>
                        <p className="users-hero-text mb-0">
                          Manage member records, account activity, and access status.
                        </p>
                      </div>
                      <div className="users-hero-stats">
                        <span className="users-stat-chip users-stat-total">
                          Total: {user_details?.length || 0}
                        </span>
                        <span className="users-stat-chip users-stat-active">
                          Active: {user_details?.filter((u) => u?.isActive).length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="users-toolbar">
                      <div className="users-search-wrap">
                        <i className="bx bx-search users-search-icon" />
                        <input
                          type="text"
                          className="form-control users-search-input"
                          placeholder="Search Username..."
                          onChange={(e) => {
                            const value = e.target.value;
                            //   Check if the first character entered is a space
                            if (value.length === 1 && value[0] === " ") {
                              e.target.value = "";
                              //    Clear the input field
                              return;
                              //    Prevent further action
                            }
                            setpages({
                              ...pages,
                              query: value.trim(),
                            });
                          }}
                        />
                      </div>
                      <button
                        className="users-add-btn"
                        onClick={() => setmodal(true)}
                      >
                        <i className="bx bx-plus" />
                        Add User
                      </button>
                    </div>

                    <div className="table-responsive users-table-wrap">
                      <table className="table table-hover table-bordered mb-0 users-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Gender</th>
                            <th>Mobile</th>
                            <th>Status</th>
                            {/* <th>DOB</th> */}
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('joinedDate')}>
                              Joined Date {sortConfig.key === 'joinedDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {user_details?.length ? (
                            <>
                              {getSortedData().map((value, key) => (
                                <tr key={key}>
                                  <th>
                                    {pages.page === 1
                                      ? key + 1
                                      : pages.limit * (pages.page - 1) +
                                      (key + 1)}
                                  </th>
                                  <td>
                                    <Link className="users-name-link" to={`/user-detail/${value?._id}`}>
                                      {value.user_detail
                                        ? value.user_detail.name
                                        : ""}
                                    </Link>
                                  </td>
                                  <td>{value?.username === "fitness@gmail.com" ? value?.username : value?.email}</td>
                                  <td>
                                    {value.user_detail?.gender
                                      ? value.user_detail.gender === "male"
                                        ? "Male"
                                        : "Female"
                                      : ""}
                                  </td>
                                  <td>{value.mobile}</td>
                                  <td className="">
                                    <div className="form-check form-switch">
                                      <input className="form-check-input users-status-switch" type="checkbox" role="switch" id={`user-${value?._id}`} checked={getResolvedAccessValue(value)}
                                        onChange={(e) => { changeStatus(e, value) }}
                                      />
                                    </div>
                                  </td>
                                  <td>
                                    {moment(value.createdAt).format(
                                      "DD MMMM YYYY"
                                    )}
                                  </td>
                                  <td className="d-flex align-items-center gap-3">
                                    <button
                                      type="button"
                                      className="users-edit-btn"
                                      onClick={() => {
                                        onEditClicked(value)
                                      }}
                                    >
                                      <i className='bx bx-edit' />
                                    </button>
                                    <button
                                      type="button"
                                      className="users-delete-btn"
                                      aria-label="Delete user"
                                      onClick={() => {
                                        setdelete_confirm_modal({
                                          show: true,
                                          id: value?._id
                                        })
                                      }}
                                    >
                                      <i className="bx bx-trash" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </>
                          ) : (
                            <tr>
                              <td colSpan={12} className="users-empty-row">
                                <b> No Users Joined </b>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {!is_next && pages.page === 1 ? (
                      ""
                    ) : (
                      <nav className="users-pagination-wrap" aria-label="Page navigation example ">
                        <ul className="pagination justify-content-end mt-2 users-pagination">
                          {pages.page === 1 ? (
                            <li
                              className="page-item disabled"
                              style={{ cursor: "not-allowed" }}
                            >
                              <a
                                className="page-link"
                                href={undefined}
                                tabIndex="-1"
                              >
                                Previous
                              </a>
                            </li>
                          ) : (
                            <li
                              className="page-item"
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                setpages({ ...pages, page: pages.page - 1 })
                              }
                            >
                              <a
                                className="page-link"
                                href={undefined}
                                tabIndex="-1"
                              >
                                Previous
                              </a>
                            </li>
                          )}

                          {is_next ? (
                            <li
                              className="page-item"
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                setpages({ ...pages, page: pages.page + 1 })
                              }
                            >
                              <a className="page-link" href={undefined}>
                                Next
                              </a>
                            </li>
                          ) : (
                            <li
                              className="page-item disabled"
                              style={{ cursor: "not-allowed" }}
                            >
                              <a className="page-link" href={undefined}>
                                Next
                              </a>
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
            <h5 className="modal-title">User</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body">
            <Form
              noValidate
              validated={validated}
              autoComplete="off"
              onSubmit={
                userData?.user_id
                  ? (event) =>
                    Check_Validation(event, updateUser, setvalidated)
                  : (event) =>
                    Check_Validation(event, addUser, setvalidated)
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
                      value={userData.name ? userData.name : ""}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          name: e.target.value,
                        })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter Name"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Name
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Gender
                    </label>
                    <select
                      className="form-control"
                      required
                      value={userData.gender ? userData.gender : ""}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="" hidden defaultValue="">
                        -- Choose gender --
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <Form.Control.Feedback type="invalid">
                      Please provide a Gender
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>

              <div className="row ">
                <div className="col-md-12">
                  <div className="mb-3">
                    <label htmlFor="formrow-email-input" className="form-label">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={userData.email ? userData.email : ""}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          email: e.target.value,
                        })
                      }
                      className="form-control"
                      id="formrow-email-input"
                      placeholder="Enter Your Name"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a Name
                    </Form.Control.Feedback>
                  </div>
                </div>
              </div>
              <div className="row ">
                <div className="col-md-12">
                  <div className="mb-3">
                    <label
                      htmlFor="formrow-password-input"
                      className="form-label"
                    >
                      Mobile
                    </label>
                    <PhoneInput
                      country={"in"}
                      value={userData.mobile || ""}
                      onChange={(phone) => setUserData({ ...userData, mobile: phone })}
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
                      Please provide a Mobile
                    </Form.Control.Feedback>
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
                  className="d-flex flex-wrap gap-2  mt-2"
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
                    {userData.user_id ? "Update" : "Submit"}
                  </button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </Modal>

      {delete_confirm_modal.show && (
        <DeleteConfirmModal
          message="Do You want to Delete This User ?"
          delete_modal={delete_confirm_modal.show}
          modal_toggle={() =>
            setdelete_confirm_modal({ show: false, id: null })
          }
          next_fun={Fun_Delete}
        />
      )}


    </>
  );
}

export default UsersPage;
