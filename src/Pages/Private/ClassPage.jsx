import { useContext, useEffect, useState } from "react";
import { ApiCall, apiClient } from "../../Services/ApiCall";
import { Form, Modal } from "react-bootstrap";
import { Show_Toast } from "../../utils/Toast";
import { ContextDatas } from "../../Services/Context";
import { Helmet } from "react-helmet";
import moment from "moment";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import imageCompression from "browser-image-compression";
import {
  DEFAULT_IMAGE_PATH,
  getImageUrl,
} from "../../utils/uploadHelpers";

const COPIED_CLASS_STORAGE_KEY = "fitness_admin_copied_class";

const getClassTypeSortTimestamp = (value) => {
  const timestamp = new Date(
    value?.createdAt || value?.created_at || value?.updatedAt || 0
  ).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getObjectIdTimestamp = (value) => {
  const id = getEntityId(value);

  if (!isLikelyObjectId(id)) {
    return 0;
  }

  const timestamp = parseInt(id.slice(0, 8), 16) * 1000;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getClassSortTimestamp = (value) => {
  const createdTimestamp = new Date(
    value?.createdAt ||
    value?.created_at ||
    value?.updatedAt ||
    value?.updated_at ||
    0
  ).getTime();

  if (!Number.isNaN(createdTimestamp) && createdTimestamp > 0) {
    return createdTimestamp;
  }

  const objectIdTimestamp = getObjectIdTimestamp(value);

  if (objectIdTimestamp > 0) {
    return objectIdTimestamp;
  }

  const fallbackTimestamp = new Date(
    `${value?.start_date || ""} ${value?.start_time || ""}`.trim() || value?.start_date || 0
  ).getTime();

  return Number.isNaN(fallbackTimestamp) ? 0 : fallbackTimestamp;
};

const getEntityId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value?._id || value?.id || "";
};

const isLikelyObjectId = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value.trim());

const getEntityName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return isLikelyObjectId(value) ? "" : value;
  }

  return (
    value?.name ||
    value?.class_name ||
    value?.title ||
    value?.studioName ||
    value?.instructor_name ||
    value?.user_name ||
    ""
  );
};

const getClassStatusField = (value) => {
  if (value && typeof value === "object") {
    if (Object.prototype.hasOwnProperty.call(value, "status")) {
      return "status";
    }

    if (Object.prototype.hasOwnProperty.call(value, "isActive")) {
      return "isActive";
    }

    if (Object.prototype.hasOwnProperty.call(value, "access")) {
      return "access";
    }
  }

  return "status";
};

const getResolvedClassStatus = (value) => {
  const rawValue = value?.status ?? value?.isActive ?? value?.access ?? "inactive";

  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  if (typeof rawValue === "number") {
    return rawValue === 1;
  }

  if (typeof rawValue === "string") {
    return ["active", "enabled", "true", "1"].includes(
      rawValue.trim().toLowerCase()
    );
  }

  return false;
};

const getClassTogglePayload = (value, nextStatus) => {
  const statusField = getClassStatusField(value);
  const currentValue = value?.[statusField];

  if (typeof currentValue === "boolean") {
    return { [statusField]: nextStatus };
  }

  if (typeof currentValue === "number") {
    return { [statusField]: nextStatus ? 1 : 0 };
  }

  if (typeof currentValue === "string") {
    const normalizedValue = currentValue.trim().toLowerCase();

    if (["active", "inactive"].includes(normalizedValue)) {
      return { [statusField]: nextStatus ? "active" : "inactive" };
    }

    if (["enabled", "disabled"].includes(normalizedValue)) {
      return { [statusField]: nextStatus ? "enabled" : "disabled" };
    }

    if (["1", "0"].includes(normalizedValue)) {
      return { [statusField]: nextStatus ? "1" : "0" };
    }
  }

  return { [statusField]: nextStatus ? "active" : "inactive" };
};

const normalizeClassRecord = (value) => ({
  ...value,
  status: getResolvedClassStatus(value) ? "active" : "inactive",
});

function ClassPage() {
  const { Check_Validation } = useContext(ContextDatas);

  const [modal, setmodal] = useState(false);
  const [validated, setvalidated] = useState(false);
  const [pages, setpages] = useState({ limit: 10, page: 1 });

  const [instructorlist, setinstructorlist] = useState([]);
  const [studiolist, setstudiolist] = useState([]);
  const [allclasses, setallclasses] = useState([]);
  const [classTypes, setclassTypes] = useState([]);
  const [classTypeModal, setClassTypeModal] = useState(false);
  const [classTypeValidated, setClassTypeValidated] = useState(false);
  const [classTypeLoading, setclassTypeLoading] = useState(false);
  const [classTypeForm, setClassTypeForm] = useState({
    id: "",
    name: "",
    description: "",
  });

  const [pagination, setpagination] = useState({
    is_next: false,
    is_prev: false,
  });

  const [image, setimage] = useState("");
  const [loading, setloading] = useState(false);
  const [classdata, setclassdata] = useState({});

  const [delete_confirm_modal, setdelete_confirm_modal] = useState({
    show: false,
    id: "",
    type: "schedule",
  });

  useEffect(() => {
    getClasses();
  }, [pages.page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getClasses();
    getInstructorList();
    getStudio();
    getClassTypes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const Upload_Image = async (e) => {
    const fileName = e.target.value;
    const idxDot = fileName.lastIndexOf(".") + 1;
    const extFile = fileName.substring(idxDot).toLowerCase();

    if (["jpg", "jpeg", "png", "webp"].includes(extFile)) {
      if (e.target.files[0]) {
        try {
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
      } else {
        setimage("");
      }
    } else {
      Show_Toast("Only Images are Allowed", false);
      setimage("");
      e.target.value = "";
    }
  };

  const getClassTypeId = (value) =>
    value?.classTypeId?._id ||
    value?.classTypeId ||
    value?.class_type?._id ||
    value?.class_type ||
    "";

  const buildClassDraft = (value) => ({
    classTypeId: getClassTypeId(value),
    capacity: value?.capacity || "",
    studio_id: getEntityId(value?.studio_id),
    instructor: getEntityId(value?.instructor),
    duration: value?.duration || "",
    start_date_new: value?.start_date ? new Date(value.start_date) : null,
    description: value?.description || "",
    imagePath: value?.image || "",
  });

  const getClassPayload = (data) => {
    if (!data.start_date_new || !(data.start_date_new instanceof Date)) {
      console.error("Invalid start date");
      return {};
    }

    const rest = { ...(data || {}) };

    delete rest.imagePath;
    delete rest.start_date_new;

    const duration = parseInt(data.duration, 10) || 0;
    const startDate = new Date(data.start_date_new);
    const selectedClassType =
      classTypes.find((item) => item?._id === data?.classTypeId) || null;

    if (Number.isNaN(startDate.getTime())) {
      console.error("Invalid date after conversion");
      return {};
    }

    const startTime = new Date(startDate);
    const closeTime = new Date(startDate);
    closeTime.setMinutes(closeTime.getMinutes() + duration);

// already there in your file

// ✅ FIXED (NO TIMEZONE BUG)
const formattedDate = moment(startDate).format("YYYY-MM-DD");
const formattedStartTime = moment(startTime).format("HH:mm");
const formattedCloseTime = moment(closeTime).format("HH:mm");

return {
  ...rest,
  name: selectedClassType?.name || data?.name || "",
  class_type: data.classTypeId,
  classTypeId: data.classTypeId,
  studio_id: data.studio_id,
  instructor: data.instructor,
  start_date: formattedDate,
  start_time: formattedStartTime,
  close_time: formattedCloseTime,
};
  };

  const getClassTypePayload = () => ({
    name: classTypeForm.name.trim(),
    description: classTypeForm.description.trim(),
  });

  const getImageFileFromPath = async (imagePath, fallbackName = "class-copy") => {
    if (!imagePath) {
      return null;
    }

    const imageUrl = getImageUrl(imagePath, DEFAULT_IMAGE_PATH);

    if (!imageUrl || imageUrl === DEFAULT_IMAGE_PATH) {
      return null;
    }

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();
      const extension = blob.type?.split("/")?.[1]?.split("+")?.[0] || "jpg";

      return new File([blob], `${fallbackName}.${extension}`, {
        type: blob.type || "image/jpeg",
      });
    } catch (error) {
      console.error("Error copying class image:", error);
      return null;
    }
  };

  const openNewClassModal = () => {
    setclassdata({});
    setimage("");
    setvalidated(false);
    setmodal(true);
  };

  const openAddClassTypeModal = () => {
    setClassTypeForm({ id: "", name: "", description: "" });
    setClassTypeValidated(false);
    setClassTypeModal(true);
  };

  const openEditClassTypeModal = (type) => {
    setClassTypeForm({
      id: type?._id || "",
      name: type?.name || "",
      description: type?.description || "",
    });
    setClassTypeValidated(false);
    setClassTypeModal(true);
  };

  const closeClassTypeModal = () => {
    setClassTypeForm({ id: "", name: "", description: "" });
    setClassTypeValidated(false);
    setClassTypeModal(false);
  };

  const applyDraftToForm = async (draft, toastMessage) => {
    const normalizedStartDate =
      draft?.start_date_new instanceof Date
        ? draft.start_date_new
        : draft?.start_date_new
          ? new Date(draft.start_date_new)
          : null;
    const copiedImageFile = await getImageFileFromPath(
      draft?.imagePath,
      `class-copy-${Date.now()}`
    );

    setclassdata({
      ...draft,
      start_date_new:
        normalizedStartDate && !Number.isNaN(normalizedStartDate.getTime())
          ? normalizedStartDate
          : null,
      image: copiedImageFile || undefined,
    });
    setimage(copiedImageFile ? URL.createObjectURL(copiedImageFile) : "");
    setvalidated(false);
    setmodal(true);

    if (toastMessage) {
      Show_Toast(
        copiedImageFile || !draft?.imagePath
          ? toastMessage
          : `${toastMessage}. Please upload a new image before saving.`,
        true
      );
    }
  };

  const copyClassForAdd = async (value) => {
    const draft = buildClassDraft(value);

    localStorage.setItem(COPIED_CLASS_STORAGE_KEY, JSON.stringify(draft));

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(JSON.stringify(draft))
        .catch(() => undefined);
    }

    await applyDraftToForm(draft, "Class copied into add form");
  };

 const sortClasses = (classes) => {
  const now = new Date();

  return [...classes].sort((a, b) => {
    const dateA = new Date(`${a.start_date} ${a.start_time}`);
    const dateB = new Date(`${b.start_date} ${b.start_time}`);
    const timestampA = getClassSortTimestamp(a);
    const timestampB = getClassSortTimestamp(b);

    const isPastA = dateA < now;
    const isPastB = dateB < now;

    // ✅ Step 1: Future classes first
    if (isPastA !== isPastB) {
      return isPastA ? 1 : -1;
    }

    // ✅ Step 2: Sort by time ascending
    if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
      return timestampA - timestampB;
    }

    return dateA - dateB;
  });
};

  const buildLocalClassRecord = (payload, response) => {
    const existingStatus = payload?.status || "inactive";
    const localStatus =
      getClassTogglePayload(
        { status: existingStatus },
        getResolvedClassStatus({ status: existingStatus })
      ).status || "inactive";
    const responseMessage = response?.message;
    const responseData =
      responseMessage?.data?.doc ||
      responseMessage?.data ||
      responseMessage?.doc ||
      responseMessage?.class ||
      null;

    if (responseData && !Array.isArray(responseData) && typeof responseData === "object") {
      return responseData;
    }

    const selectedClassType =
      classTypes.find((item) => item?._id === payload?.classTypeId) || null;
    const selectedInstructor =
      instructorlist.find((item) => item?._id === payload?.instructor) || null;
    const selectedStudio =
      studiolist.find((item) => item?._id === payload?.studio_id) || null;

    return {
      _id: `${Date.now()}`,
      status: localStatus,
      name: selectedClassType?.name || "N/A",
      class_type: selectedClassType
        ? {
            _id: selectedClassType._id,
            name: selectedClassType.name,
          }
        : null,
      classTypeId: payload?.classTypeId || "",
      capacity: payload?.capacity,
      duration: payload?.duration,
      instructor: selectedInstructor
        ? {
            _id: selectedInstructor._id,
            name: selectedInstructor.name,
          }
        : null,
      studio_id: selectedStudio
        ? {
            _id: selectedStudio._id,
            name: selectedStudio.name,
          }
        : null,
      start_date: payload?.start_date,
      start_time: payload?.start_time,
      description: payload?.description || "",
      image: image || classdata?.image || "",
      booked_count: 0,
      waitinglist_count: 0,
      createdAt: new Date().toISOString(),
    };
  };

  const getClasses = async (nextPages = pages) => {
    try {
      const response = await apiClient.post("/classes/listing", {}, {
        params: {
          ...nextPages,
          _t: Date.now(),
        },
        // headers: {
        //   "Cache-Control": "no-cache",
        // },

      });

      const responseData = response?.data;
      console.log("FULL RESPONSE:", responseData);

      const docs =
        responseData?.data?.docs ||
        responseData?.data ||
        [];

      const normalizedDocs = Array.isArray(docs)
        ? docs.map(normalizeClassRecord)
        : [];

      const sortedDocs = sortClasses(normalizedDocs);
      console.log("FINAL FIXED DOCS:", sortedDocs);

      setallclasses([...sortedDocs]);
      setpagination({
        is_next: responseData?.data?.hasNextPage || false,
        is_prev: responseData?.data?.hasPrevPage || false,
      });
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const currentPage = Math.max(1, Number(pages?.page) || 1);
  console.log("RENDER DATA:", allclasses);

  const getStudio = async () => {
    const response = await ApiCall("get", "/studios/list", {}, { select: "name" });

    if (response.status) {
      setstudiolist(response.message.docs);
    }
  };

  const getInstructorList = async () => {
    const response = await ApiCall("get", "/instructors", {}, { select: "name" });

    if (response.status) {
      setinstructorlist(response.message.docs);
    }
  };

  const getClassTypes = async () => {
    try {
      const response = await ApiCall("get", "/classes/class-types");

      if (response?.status) {
        const data =
          response.message?.data ||
          response.message?.docs ||
          response.message ||
          [];

        const sortedClassTypes = Array.isArray(data)
          ? [...data].sort(
              (firstType, secondType) =>
                getClassTypeSortTimestamp(secondType) -
                getClassTypeSortTimestamp(firstType)
            )
          : [];

        setclassTypes(sortedClassTypes);
      }
    } catch (error) {
      console.error("Error fetching class types:", error);
      setclassTypes([]);
    }
  };
  const Fun_Delete = async () => {
    if (delete_confirm_modal.type === "classType") {
      const response = await ApiCall("delete", "/classes/class-types", {
        id: delete_confirm_modal.id,
      });

      if (response.status) {
        await getClassTypes();
        setdelete_confirm_modal({ show: false, id: "", type: "schedule" });
      }

      return;
    }

    const response = await ApiCall("delete", "/classes", {
      id: delete_confirm_modal.id,
    });

    if (response.status) {
      await getClasses();
      setdelete_confirm_modal({ show: false, id: "", type: "schedule" });
    }
  };

const addClass = async () => {
  setloading(true);
  
  const datesToProcess = classdata.start_dates && classdata.start_dates.length > 0 
     ? classdata.start_dates 
     : [classdata.start_date_new];

  let lastCreatedClass = null;
  let anySuccess = false;

  for (let i = 0; i < datesToProcess.length; i++) {
    const dateVal = datesToProcess[i];
    if (!dateVal) continue;

    const payload = getClassPayload({...classdata, start_date_new: dateVal});
    if (!Object.keys(payload).length) continue;

    if (!payload.studio_id) {
      setloading(false);
      Show_Toast("Please select a Studio", false);
      return;
    }

    const formData = new FormData();

    Object.keys(payload).forEach((key) => {
      if (key !== "image") {
        formData.append(key, payload[key] || "");
      }
    });

    if (classdata.image) {
      formData.append("image", classdata.image);
    }

    const response = await ApiCall(
      "post",
      "/classes",
      formData,
      {},
      "multipart/form-data"
    );

    if (response.status) {
      anySuccess = true;
      lastCreatedClass = buildLocalClassRecord(payload, response);
    }
  }

  setloading(false);

  if (anySuccess) {
    const firstPage = { ...pages, page: 1 };
    setpages(firstPage);
    if (lastCreatedClass) {
      setallclasses((current) =>
        sortClasses(
          [lastCreatedClass, ...current.filter((item) => item?._id !== lastCreatedClass?._id)]
        )
      );
    }
    setimage("");
    setclassdata({});
    setmodal(false);
    setvalidated(false);
    await getClasses(firstPage);
  } else {
    Show_Toast("Please select a valid class date and time", false);
  }
};

  const onEditClicked = (value) => {
    // Combine date and time to create proper datetime
    const dateTimeString = value?.start_date && value?.start_time 
      ? `${value.start_date}T${value.start_time}`
      : value?.start_date;
    
    setclassdata({
      classTypeId: getClassTypeId(value),
      capacity: value.capacity,
      studio_id: getEntityId(value?.studio_id),
      instructor: getEntityId(value?.instructor),
      duration: value.duration,
      start_date_new: dateTimeString ? new Date(dateTimeString) : null,
      available_count: value.available_count,
      booked_count: value.booked_count,
      description: value.description,
      id: value._id,
    });

    setimage(getImageUrl(value.image, DEFAULT_IMAGE_PATH));
    setmodal(true);
  };

  const updateClass = async () => {
    if (Number(classdata?.capacity) < Number(classdata?.booked_count)) {
      Show_Toast("Slot must be greater or equal to booking count", false);
      return;
    }

    setloading(true);
    const payload = getClassPayload(classdata);

    if (!Object.keys(payload).length) {
      setloading(false);
      Show_Toast("Please select a valid class date and time", false);
      return;
    }

    const response = await ApiCall(
      "put",
      "/classes",
      payload,
      {},
      "multipart/form-data"
    );

    setloading(false);

    if (response.status) {
      await getClasses();
      setmodal(false);
      setimage("");
      setclassdata({});
      setvalidated(false);
    }
  };

  const handleClose = () => {
    setimage("");
    setclassdata({});
    setvalidated(false);
    setmodal(false);
  };

  const saveClassType = async () => {
    const payload = getClassTypePayload();

    if (!payload.name) {
      Show_Toast("Please enter a class type name", false);
      return;
    }

    setclassTypeLoading(true);

    const response = classTypeForm.id
      ? await ApiCall("put", "/classes/class-types", {
          id: classTypeForm.id,
          ...payload,
        })
      : await ApiCall("post", "/classes/class-types", payload);

    setclassTypeLoading(false);

    if (response.status) {
      closeClassTypeModal();
      await getClassTypes();
    }
  };

  const getClassTypeDescription = (value) =>
    value?.description || value?.details || value?.desc || "-";

  const getClassTypeCreatedDate = (value) => {
    const dateValue =
      value?.createdAt || value?.created_at || value?.date || value?.updatedAt;

    return dateValue ? moment(dateValue).format("DD MMM YYYY") : "-";
  };

  const getResolvedClassName = (value) => {
    const classTypeId = getClassTypeId(value);
    const directName =
      value?.class_type?.name ||
      getEntityName(value?.class_type) ||
      value?.name ||
      value?.class_name;

    if (directName) {
      return directName;
    }

    return classTypes.find((item) => item?._id === classTypeId)?.name || "No Name";
  };

  const getResolvedInstructorName = (value) => {
    const directName =
      getEntityName(value?.instructor) ||
      getEntityName(value?.instructor_id) ||
      value?.instructor_name;

    if (directName) {
      return directName;
    }

    const instructorId = getEntityId(value?.instructor || value?.instructor_id);
    return instructorlist.find((item) => item?._id === instructorId)?.name || "-";
  };

  const getResolvedStudioName = (value) => {
    const directName =
      getEntityName(value?.studio_id) ||
      getEntityName(value?.studio) ||
      value?.studio_name;

    if (directName) {
      return directName;
    }

    const studioId = getEntityId(value?.studio_id || value?.studio);
    return studiolist.find((item) => item?._id === studioId)?.name || "-";
  };

  return (
    <div>
      <div className="page-content">
        <div className="container-fluid">
          <div className="card shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                <div>
                  <h4 className="card-title mb-1">Classes List</h4>
                  <p className="text-muted mb-0">
                    Manage your class types such as Yoga, Cardio, and Pilates.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddClassTypeModal}
                >
                  Add Class Type
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "70px" }}>#</th>
                      <th>Class Name</th>
                      <th>Description</th>
                      <th>Created Date</th>
                      <th style={{ width: "180px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classTypes.length ? (
                      classTypes.map((type, index) => (
                        <tr key={type?._id || index}>
                          <td>{index + 1}</td>
                          <td>{type?.name || "-"}</td>
                          <td>{getClassTypeDescription(type)}</td>
                          <td>{getClassTypeCreatedDate(type)}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => openEditClassTypeModal(type)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() =>
                                  setdelete_confirm_modal({
                                    show: true,
                                    id: type?._id,
                                    type: "classType",
                                  })
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          No classes available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                <div>
                  <h4 className="card-title mb-1">Schedule Classes</h4>
                  <p className="text-muted mb-0">
                    Review and manage all scheduled classes for your studio.
                  </p>
                </div>

                <button className="btn btn-primary" onClick={openNewClassModal}>
                  <i className="bx bx-plus me-1"></i>
                  Add Class
                </button>
              </div>

              {allclasses.length > 0 ? (
                <div className="row g-3">
                  {allclasses.map((value, key) => {
                    const className = getResolvedClassName(value);
                    const instructorName = getResolvedInstructorName(value);
                    const studioName = getResolvedStudioName(value);

                    return (
                      <div key={value._id || key} className="col-12 col-lg-6">
                        <div className="card border h-100">
                          <div className="card-body">
                            <div className="row">
                              <div className="col-4">
                                <img
                                  src={getImageUrl(value?.image)}
                                  alt="class"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = DEFAULT_IMAGE_PATH;
                                  }}
                                  style={{
                                    width: "100%",
                                    height: "120px",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                              <div className="col-8">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h5 className="mb-1">{className}</h5>
                                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>{studioName}</p>
                                  </div>
                                  <span className={`badge ${value.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                    {value.status || 'inactive'}
                                  </span>
                                </div>
                                
                                <div className="mb-2">
                                  <div className="row g-2" style={{ fontSize: '14px' }}>
                                    <div className="col-6">
                                      <strong>Instructor:</strong>
                                      <div className="text-muted">{instructorName}</div>
                                    </div>
                                    <div className="col-6">
                                      <strong>Capacity:</strong>
                                      <div className="text-muted">{value.capacity}</div>
                                    </div>
                                    <div className="col-6">
                                      <strong>Duration:</strong>
                                      <div className="text-muted">{value.duration} min</div>
                                    </div>
                                    <div className="col-6">
                                      <strong>Date & Time:</strong>
                                      <div className="text-muted">
                                        {value.start_date && value.start_time
                                          ? moment(
                                              `${value.start_date} ${value.start_time}`,
                                              "YYYY-MM-DD HH:mm"
                                            ).format("DD MMM, hh:mm A")
                                          : "No Date"}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-2">
                                  <strong style={{ fontSize: '14px' }}>Description:</strong>
                                  <p className="text-muted mb-0" style={{
                                    fontSize: '14px',
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical"
                                  }}>
                                    {value.description || "No description"}
                                  </p>
                                </div>

                                <div className="d-flex gap-2 mb-2">
                                  <span className="badge bg-info">
                                    Booked: {value.booked_count}
                                  </span>
                                  <span className="badge bg-warning text-dark">
                                    Waiting: {value.waitinglist_count}
                                  </span>
                                </div>

                                <div className="d-flex gap-2 flex-wrap">
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => onEditClicked(value)}
                                  >
                                    <i className="bx bx-edit me-1"></i>Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => copyClassForAdd(value)}
                                  >
                                    <i className="bx bx-copy me-1"></i>Copy
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      setdelete_confirm_modal({
                                        show: true,
                                        id: value._id,
                                        type: "schedule",
                                      })
                                    }
                                  >
                                    <i className="bx bx-trash me-1"></i>Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bx bx-calendar-x" style={{ fontSize: "48px", color: "#ccc" }}></i>
                  <p className="text-muted mt-2">No classes available</p>
                </div>
              )}

              {!pagination.is_next && !pagination.is_prev ? null : (
                <nav className="mt-4 d-flex justify-content-end">
                  <ul className="pagination mb-0">
                    <li
                      style={{ cursor: pagination.is_prev ? "pointer" : "not-allowed" }}
                      className={`page-item shadow-none ${pagination.is_prev ? "" : "disabled"}`}
                      onClick={() =>
                        pagination.is_prev && setpages({ ...pages, page: pages.page - 1 })
                      }
                    >
                      <span className="page-link">
                        <i className="mdi mdi-chevron-left" />
                        Previous
                      </span>
                    </li>
                    <li
                      style={{ cursor: pagination.is_next ? "pointer" : "not-allowed" }}
                      className={`page-item shadow-none ${pagination.is_next ? "" : "disabled"}`}
                      onClick={() =>
                        pagination.is_next && setpages({ ...pages, page: pages.page + 1 })
                      }
                    >
                      <span className="page-link">
                        Next <i className="mdi mdi-chevron-right" />
                      </span>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal centered show={classTypeModal} onHide={closeClassTypeModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {classTypeForm.id ? "Edit Class Type" : "Add Class Type"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            noValidate
            validated={classTypeValidated}
            onSubmit={(event) => Check_Validation(event, saveClassType, setClassTypeValidated)}
          >
            <div className="mb-3">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                className="form-control"
                required
                value={classTypeForm.name}
                onChange={(event) =>
                  setClassTypeForm({ ...classTypeForm, name: event.target.value })
                }
                placeholder="Enter class name"
              />
              <Form.Control.Feedback type="invalid">
                Please provide a class name
              </Form.Control.Feedback>
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={classTypeForm.description}
                onChange={(event) =>
                  setClassTypeForm({
                    ...classTypeForm,
                    description: event.target.value,
                  })
                }
                placeholder="Enter class description"
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeClassTypeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={classTypeLoading}
              >
                {classTypeLoading
                  ? "Saving..."
                  : classTypeForm.id
                    ? "Update Class Type"
                    : "Save Class Type"}
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        centered
        show={modal}
        backdrop="static"
        onHide={handleClose}
        size="xl"
        dialogClassName="studio-form-dialog"
        className="studio-form-shell class-form-shell"
      >
        <div className="modal-content studio-form-modal studio-form-modal-v2 class-form-modal-v2">
          <div className="modal-header studio-form-header studio-form-header-v2 class-form-header-v2">
            <div>
              <span className="studio-kicker">{classdata?.id ? "Edit Mode" : "New Class"}</span>
              <h5 className="modal-title">Class Setup Console</h5>
              <p className="studio-form-subtitle mb-0">
                Create class schedule, assign team, and publish class details.
              </p>
            </div>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>

          <div className="modal-body studio-form-body studio-form-body-v2 class-form-body-v2">
            <Form
              className="studio-form-grid studio-form-grid-v2 class-form-grid-v2"
              noValidate
              validated={validated}
              autoComplete="off"
              onSubmit={
                classdata?.id
                  ? (event) => Check_Validation(event, updateClass, setvalidated)
                  : (event) => Check_Validation(event, addClass, setvalidated)
              }
            >
              <div className="studio-form-card-grid class-form-card-grid">
                <section className="studio-form-card class-form-card">
                  <div className="studio-card-head">
                    <span>01</span>
                    <h6>Core Details</h6>
                  </div>
                  <div className="row g-3 class-core-details-row">
                    <div className="col-12 col-lg-6 class-core-field">
                      <label className="form-label">Class Name</label>
                      <select
                        name="classTypeId"
                        required
                        value={classdata?.classTypeId || ""}
                        onChange={(e) =>
                          setclassdata({ ...classdata, classTypeId: e.target.value })
                        }
                        className="form-control"
                      >
                        <option value="">Select Class</option>
                        {classTypes && classTypes.length > 0 ? (
                          classTypes.map((option) => (
                            <option key={option._id} value={option._id}>
                              {option.name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No Class Types Found</option>
                        )}
                      </select>
                      <Form.Control.Feedback type="invalid">
                        Please provide a Class Name
                      </Form.Control.Feedback>
                    </div>

                    <div className="col-12 col-lg-3 class-core-field">
                      <label className="form-label">Slot ( Capacity )</label>
                      <input
                        pattern="[0-9]*"
                        required
                        min={0}
                        value={classdata?.capacity || ""}
                        onChange={(e) => setclassdata({ ...classdata, capacity: e.target.value })}
                        type="number"
                        className="form-control"
                        placeholder="Slots"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a valid Slot
                      </Form.Control.Feedback>
                    </div>

                    <div className="col-12 col-lg-3 class-core-field">
                      <label className="form-label">Duration ( Min )</label>
                      <input
                        required
                        min={1}
                        max={1439}
                        value={classdata?.duration || ""}
                        onChange={(e) => setclassdata({ ...classdata, duration: e.target.value })}
                        type="number"
                        className="form-control"
                        placeholder="Duration"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a valid Duration
                      </Form.Control.Feedback>
                    </div>
                  </div>
                </section>

                <section className="studio-form-card class-form-card">
                  <div className="studio-card-head">
                    <span>02</span>
                    <h6>Assignments</h6>
                  </div>
                  <div className="row g-3 class-core-details-row">
                    <div className="col-12 col-lg-6 class-core-field">
                      <label className="form-label">Studio</label>
                      <select
                        className="form-control"
                        value={classdata?.studio_id || ""}
                        onChange={(e) => setclassdata({ ...classdata, studio_id: e.target.value })}
                        required
                      >
                        <option value="" hidden>
                          -- Choose Studio --
                        </option>
                        {studiolist.length ? (
                          studiolist.map((value) => (
                            <option value={value._id} key={value._id}>
                              {value.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No Studio Found
                          </option>
                        )}
                      </select>
                      <Form.Control.Feedback type="invalid">
                        Please provide a Studio
                      </Form.Control.Feedback>
                    </div>

                    <div className="col-12 col-lg-6 class-core-field">
                      <label className="form-label">Instructor</label>
                      <select
                        className="form-control"
                        value={classdata?.instructor || ""}
                        onChange={(e) => setclassdata({ ...classdata, instructor: e.target.value })}
                      >
                        <option value="">
                          -- Choose Instructor (Optional) --
                        </option>
                        {instructorlist.length ? (
                          instructorlist.map((value) => (
                            <option value={value._id} key={value._id}>
                              {value.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No Instructor Found
                          </option>
                        )}
                      </select>
                      <Form.Control.Feedback type="invalid">
                        Please provide an Instructor
                      </Form.Control.Feedback>
                    </div>

                    <div className="col-12 class-core-field">
                      <label className="form-label">
                        Date & Time { !classdata?.id && "(You can add multiple times for the same day)" }
                      </label>
                      
                      {!classdata?.id ? (
                        <>
                          {(classdata?.start_dates || [null]).map((dateVal, index) => (
                            <div key={index} className="d-flex gap-2 mb-2">
                              <DatePicker
                                required
                                selected={dateVal instanceof Date ? dateVal : null}
                                onChange={(date) => {
                                  const newDates = [...(classdata?.start_dates || [null])];
                                  newDates[index] = date;
                                  setclassdata({ ...classdata, start_dates: newDates });
                                }}
                                showTimeSelect
                                timeIntervals={5}
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
                            className="btn btn-sm btn-outline-primary"
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
                            classdata?.start_date_new instanceof Date
                              ? classdata.start_date_new
                              : null
                          }
                          onChange={(date) =>
                            setclassdata({
                              ...classdata,
                              start_date_new: date || null,
                            })
                          }
                          showTimeSelect
                          timeIntervals={5}
                          timeFormat="hh:mm aa"
                          dateFormat="yyyy-MM-dd hh:mm aa"
                          className="form-control"
                          minDate={new Date()}
                          placeholderText="Select Date & Time"
                        />
                      )}
                      <Form.Control.Feedback type="invalid">
                        Please provide Date and Time
                      </Form.Control.Feedback>
                    </div>
                  </div>
                </section>

                <section className="studio-form-card class-form-card class-form-card-media">
                  <div className="studio-card-head">
                    <span>03</span>
                    <h6>Description and Image</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-lg-7">
                      <label className="form-label">Description</label>
                      <textarea
                        value={classdata?.description || ""}
                        onChange={(e) => setclassdata({ ...classdata, description: e.target.value })}
                        placeholder="Description (Optional)"
                        className="form-control"
                        rows={4}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a Description
                      </Form.Control.Feedback>
                    </div>

                    <div className="col-12 col-lg-5">
                      <label className="form-label">Image</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={Upload_Image}
                        className="form-control"
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide an Image
                      </Form.Control.Feedback>

                      {image ? (
                        <img
                          src={image}
                          alt="preview"
                          className="studio-image-preview class-image-preview mt-2"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = DEFAULT_IMAGE_PATH;
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </section>
              </div>

              {loading ? (
                <div className="studio-form-actions mt-2">
                  <button type="button" className="btn studio-btn-loading waves-effect waves-light">
                    <i className="bx bx-loader bx-spin font-size-16 align-middle me-2" /> Saving Class
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-2 studio-form-actions studio-form-footer">
                  <button type="button" onClick={handleClose} className="btn studio-btn-cancel w-md">
                    Cancel
                  </button>
                  <button type="submit" className="btn studio-btn-submit w-md">
                    {classdata?.id ? "Update Class" : "Create Class"}
                  </button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </Modal>

      {delete_confirm_modal.show && (
        <DeleteConfirmModal
          message={
            delete_confirm_modal.type === "classType"
              ? "Do You want to Delete This Class Type ?"
              : "Do You want to Delete This Class ?"
          }
          delete_modal={delete_confirm_modal.show}
          modal_toggle={() =>
            setdelete_confirm_modal({ show: false, id: "", type: "schedule" })
          }
          next_fun={Fun_Delete}
        />
      )}

      <Helmet>
        <title>Classes</title>
      </Helmet>
    </div>
  );
}

export default ClassPage;


