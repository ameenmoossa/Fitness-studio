import axios from "axios";
import { Show_Toast } from "../utils/Toast";
import { base_url } from "./BaseUrl";

const apiClient = axios.create({
  baseURL: base_url,
});

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string" && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof responseData?.error === "string" && responseData.error.trim()) {
    return responseData.error;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Internal Server Error";
};

const toFormData = (payload) => {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(key, item);
      });
      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

const logFormDataEntries = (formData) => {
  if (!(formData instanceof FormData)) {
    return;
  }

  console.log("FormData entries:");
  for (const [key, value] of formData.entries()) {
    console.log(
      key,
      value instanceof File || value instanceof Blob
        ? {
            name: value.name,
            type: value.type,
            size: value.size,
          }
        : value
    );
  }
};

const prepareRequest = (data, contentType) => {
  if (contentType === "multipart/form-data") {
    const payload = data instanceof FormData ? data : toFormData(data);
    logFormDataEntries(payload);

    return {
      payload,
      headers: {},
    };
  }

  return {
    payload: data,
    headers: {
      "Content-Type": contentType ?? "application/json",
    },
  };
};

export const ApiCall = async (method, endpoint, data, params, content_type) => {
  try {
    const { payload, headers } = prepareRequest(data, content_type);

    if (method === "post") {
      const res = await apiClient.post(endpoint, payload, { headers, params });
      if (res?.data?.message && typeof res.data.message === "string") {
        Show_Toast(res.data.message, true);
      }

      return {
        status: true,
        message: res.data,
      };
    }

  if (method === "get") {
  const res = await apiClient.get(endpoint, { headers, params });

  return {
    status: true,
    message:
      res.data.message ||
      res.data.data ||
      res.data.docs ||
      res.data,
  };
}

    if (method === "put") {
      const res = await apiClient.put(endpoint, payload, { headers, params });
      if (res?.data?.message) {
        Show_Toast(res.data.message, true);
      }

      return {
        status: true,
        message: res.data,
      };
    }

    if (method === "delete") {
      const res = await apiClient.delete(endpoint, { headers, data: payload, params });
      if (res?.data?.message) {
        Show_Toast(res.data.message, true);
      }

      return {
        status: true,
        message: res.data,
      };
    }

    return {
      status: false,
      message: "Unsupported request method",
    };
  } catch (error) {
    console.error("API ERROR:", error?.response || error);

    if (error?.response?.status === 401 && (method === "put" || method === "delete")) {
      window.location = "/session-expired";
      return {
        status: false,
        message: "Session expired",
      };
    }

    const message = getErrorMessage(error);
    Show_Toast(message, false);

    return {
      status: false,
      message,
    };
  }
};

export { apiClient };
