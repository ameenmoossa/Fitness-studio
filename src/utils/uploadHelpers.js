import { base_url } from "../Services/BaseUrl";

export const DEFAULT_IMAGE_PATH = "/assets/images/default-image.png";

const isFileLike = (value) => value instanceof File || value instanceof Blob;

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());
const hasWindowsDrivePrefix = (value) => /^[a-z]:\//i.test(value);

const normalizeImagePath = (imagePath) => {
  const cleanedPath = String(imagePath || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");

  if (!cleanedPath) {
    return "";
  }

  if (isAbsoluteUrl(cleanedPath)) {
    return cleanedPath;
  }

  const uploadsIndex = cleanedPath.toLowerCase().lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return cleanedPath.slice(uploadsIndex + 1);
  }

  if (cleanedPath.toLowerCase().startsWith("uploads/")) {
    return cleanedPath;
  }

  const publicIndex = cleanedPath.toLowerCase().lastIndexOf("/public/");
  if (publicIndex >= 0) {
    return cleanedPath.slice(publicIndex + "/public/".length);
  }

  if (cleanedPath.toLowerCase().startsWith("public/")) {
    return cleanedPath.slice("public/".length);
  }

  if (hasWindowsDrivePrefix(cleanedPath)) {
    return cleanedPath.split("/").pop() || "";
  }

  return cleanedPath;
};

export const buildMultipartFormData = (data, fileFields = ["image"]) => {
  const formData = new FormData();

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (fileFields.includes(key) && !isFileLike(value)) {
      return;
    }

    formData.append(key, value);
  });

  return formData;
};

export const getImageUrl = (imagePath, fallback = DEFAULT_IMAGE_PATH) => {
  if (!imagePath) {
    return fallback;
  }

  const normalizedBaseUrl = String(base_url || "").trim().replace(/\/+$/, "");
  const normalizedImagePath = normalizeImagePath(imagePath);

  if (!normalizedImagePath) {
    return fallback;
  }

  if (isAbsoluteUrl(normalizedImagePath)) {
    return normalizedImagePath;
  }

  return normalizedBaseUrl
    ? `${normalizedBaseUrl}/${normalizedImagePath}`
    : fallback;
};

export const resolveImageSource = getImageUrl;
