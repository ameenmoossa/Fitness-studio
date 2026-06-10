import { useCallback, useContext, useEffect, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";
import { Form, Modal } from "react-bootstrap";
import { Show_Toast } from "../../utils/Toast";
import { ContextDatas } from "../../Services/Context";
import { Helmet } from "react-helmet";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import imageCompression from "browser-image-compression";
import {
  DEFAULT_IMAGE_PATH,
  getImageUrl,
} from "../../utils/uploadHelpers";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

function InstructorPage() {
  const { Check_Validation } = useContext(ContextDatas);

  const [modal, setmodal] = useState(false);
  const [validated, setvalidated] = useState(false);
  const [pages] = useState({ limit: 10, page: 1 });
  const [instructordata, setinstructordata] = useState({});
  const [allinstructors, setallinstructors] = useState([]);
  const [image, setimage] = useState();
  const [delete_confirm_modal, setdelete_confirm_modal] = useState({ show: false, id: "" });

  const Upload_Image = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      setimage(URL.createObjectURL(compressedFile));
      setinstructordata({ ...instructordata, image: compressedFile });
    } catch {
      Show_Toast("Image compression failed", false);
    }
  };

  const getInstructors = useCallback(async () => {
    const response = await ApiCall("get", "/instructors", {}, pages);
    if (response.status) {
      setallinstructors(response.message.docs);
    }
  }, [pages]);

  useEffect(() => {
    getInstructors();
  }, [getInstructors]);

  const addInstructor = async () => {
    const response = await ApiCall(
      "post",
      "/instructors",
      instructordata,
      {},
      "multipart/form-data"
    );

    if (response.status) {
      setinstructordata({});
      handleClose();
      getInstructors();
    }
  };

  const onEditIconClicked = (value) => {
    setinstructordata({
      name: value.name,
      specialization: value.specialization,
      experience: value.experience,
      gender: value.gender,
      mobile: value.mobile,
      description: value.description,
      instructor_id: value._id,
    });

    setimage(getImageUrl(value.image, DEFAULT_IMAGE_PATH));
    setmodal(true);
  };

  const updateInstructor = async () => {
    const response = await ApiCall(
      "put",
      "/instructors",
      instructordata,
      {},
      "multipart/form-data"
    );

    if (response.status) {
      handleClose();
      getInstructors();
    }
  };

  const Fun_Delete = async () => {
    const response = await ApiCall("delete", "/instructors", {
      _id: delete_confirm_modal.id,
    });

    if (response.status) {
      getInstructors();
      setdelete_confirm_modal({ show: false, id: "" });
    }
  };

  const handleClose = () => {
    setinstructordata({});
    setimage("");
    setmodal(false);
    setvalidated(false);
  };

  return (
    <div>
      <div className="page-content">
        <div className="container-fluid">
          <h4 className="card-title">Instructor List</h4>

          <button
            className="btn btn-primary mb-3"
            onClick={() => {
              setinstructordata({});
              setimage("");
              setvalidated(false);
              setmodal(true);
            }}
          >
            Add Instructor
          </button>

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Mobile</th>
                <th>Bio</th>
                <th>Image</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {allinstructors.map((value, key) => (
                <tr key={key}>
                  <td>{key + 1}</td>
                  <td>{value.name}</td>
                  <td>{value.specialization}</td>
                  <td>{value.experience}</td>
                  <td>{value.mobile}</td>
                  <td>{value.description}</td>

                  <td>
                    <img
                      src={getImageUrl(value?.image)}
                      alt={value?.name || "Instructor"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_IMAGE_PATH;
                      }}
                      width="80"
                    />
                  </td>

                  <td>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => onEditIconClicked(value)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        setdelete_confirm_modal({
                          show: true,
                          id: value._id,
                        })
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal centered show={modal} onHide={handleClose} size="lg">
        <div className="modal-header">
          <h5 className="modal-title">Instructor</h5>
          <button className="btn-close" onClick={handleClose}></button>
        </div>

        <div className="modal-body">
          <Form
            noValidate
            validated={validated}
            onSubmit={
              instructordata.instructor_id
                ? (e) => Check_Validation(e, updateInstructor, setvalidated)
                : (e) => Check_Validation(e, addInstructor, setvalidated)
            }
          >
            <div className="row">
              <div className="col-md-6 mb-2">
                <input
                  required
                  className="form-control"
                  placeholder="Name"
                  value={instructordata.name || ""}
                  onChange={(e) =>
                    setinstructordata({ ...instructordata, name: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6 mb-2">
                <input
                  required
                  className="form-control"
                  placeholder="Specialization"
                  value={instructordata.specialization || ""}
                  onChange={(e) =>
                    setinstructordata({
                      ...instructordata,
                      specialization: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6 mb-2">
                <input
                  required
                  className="form-control"
                  placeholder="Experience"
                  value={instructordata.experience || ""}
                  onChange={(e) =>
                    setinstructordata({
                      ...instructordata,
                      experience: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6 mb-2">
                <PhoneInput
                  country={"in"}
                  value={instructordata.mobile || ""}
                  onChange={(phone) =>
                    setinstructordata({ ...instructordata, mobile: phone })
                  }
                  inputClass="form-control"
                  containerClass="w-100"
                  inputProps={{
                    required: true,
                    placeholder: "Mobile",
                  }}
                  disableDropdown={false}
                  inputStyle={{ width: "100%" }}
                />
              </div>

              <div className="col-md-6 mb-2">
                <select
                  required
                  className="form-control"
                  value={instructordata.gender || ""}
                  onChange={(e) =>
                    setinstructordata({
                      ...instructordata,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label">Image (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={Upload_Image}
                />
              </div>

              <div className="col-12 mb-2">
                <textarea
                  className="form-control"
                  placeholder="Bio (Optional)"
                  rows="3"
                  value={instructordata.description || ""}
                  onChange={(e) =>
                    setinstructordata({
                      ...instructordata,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              {image && (
                <div className="col-12 mb-3">
                  <img
                    src={image}
                    alt="Instructor preview"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_IMAGE_PATH;
                    }}
                    style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "8px" }}
                  />
                </div>
              )}

              <div className="col-12">
                <button className="btn btn-primary">
                  {instructordata.instructor_id ? "Update" : "Submit"}
                </button>
              </div>
            </div>
          </Form>
        </div>
      </Modal>

      {delete_confirm_modal.show && (
        <DeleteConfirmModal
          message="Do You want to Delete This Instructor ?"
          delete_modal={delete_confirm_modal}
          modal_toggle={() =>
            setdelete_confirm_modal({ show: false, id: null })
          }
          next_fun={Fun_Delete}
        />
      )}

      <Helmet>
        <title>Instructor</title>
      </Helmet>
    </div>
  );
}

export default InstructorPage;
