const NOTIFICATION_STORAGE_KEY = "fitness_admin_notifications";
const MAX_NOTIFICATIONS = 12;
const NOTIFICATION_EVENT = "fitness-admin-notification";
const NOTIFICATION_TYPES_TO_KEEP = new Set([
  "admin_subscription",
  "subscription",
  "admin_credit",
  "credit",
]);
const NOTIFICATION_MESSAGE_KEYWORDS = [
  "subscription",
  "subscribed",
  "membership",
  "credit",
  "credits",
  "plan activated",
];

const isBrowser = typeof window !== "undefined";

const normalizeMessage = (message = "") => String(message).toLowerCase().trim();

const normalizeNotificationType = (type = "info") => {
  const normalizedType = String(type || "info").toLowerCase().trim();

  return normalizedType || "info";
};

const normalizeNotification = (notification, fallbackType = "info") => {
  if (!notification) {
    return null;
  }

  if (typeof notification === "string") {
    const trimmedMessage = notification.trim();

    if (!trimmedMessage) {
      return null;
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: trimmedMessage,
      type: normalizeNotificationType(fallbackType),
      isAdmin: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
  }

  const message =
    typeof notification.message === "string" ? notification.message.trim() : "";

  if (!message) {
    return null;
  }

  return {
    id:
      notification.id ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type: normalizeNotificationType(notification.type || fallbackType),
    isAdmin: notification.isAdmin === true,
    isRead: notification.isRead === true,
    createdAt: notification.createdAt || new Date().toISOString(),
    user_id: notification.user_id ?? null,
  };
};

const shouldStoreNotification = (notification) => {
  const normalizedNotification = normalizeNotification(notification);

  if (!normalizedNotification) {
    return false;
  }

  const normalizedType = normalizeNotificationType(normalizedNotification.type);
  const normalizedText = normalizeMessage(normalizedNotification.message);

  if (NOTIFICATION_TYPES_TO_KEEP.has(normalizedType)) {
    return true;
  }

  return NOTIFICATION_MESSAGE_KEYWORDS.some((keyword) =>
    normalizedText.includes(keyword)
  );
};

const readNotifications = () => {
  if (!isBrowser) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    const notifications = Array.isArray(parsedValue) ? parsedValue : [];

    return notifications
      .map((notification) => normalizeNotification(notification))
      .filter((notification) => shouldStoreNotification(notification))
      .slice(0, MAX_NOTIFICATIONS);
  } catch (error) {
    console.error("Unable to read notifications:", error);
    return [];
  }
};

const writeNotifications = (notifications) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(
    NOTIFICATION_STORAGE_KEY,
    JSON.stringify(notifications)
  );
};

const emitNotifications = (notifications) => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: notifications,
    })
  );
};

export const getStoredNotifications = () => readNotifications();

export const pushNotification = (notification, type = "info") => {
  if (!isBrowser) {
    return;
  }

  const nextNotification = normalizeNotification(notification, type);

  if (!nextNotification || !shouldStoreNotification(nextNotification)) {
    return;
  }

  const currentNotifications = readNotifications();
  const latestNotification = currentNotifications[0];
  const latestTimestamp = latestNotification?.createdAt
    ? new Date(latestNotification.createdAt).getTime()
    : 0;

  if (
    latestNotification?.message === nextNotification.message &&
    latestNotification?.type === nextNotification.type &&
    latestNotification?.isAdmin === nextNotification.isAdmin &&
    Date.now() - latestTimestamp < 1500
  ) {
    return;
  }

  const nextNotifications = [nextNotification, ...currentNotifications].slice(
    0,
    MAX_NOTIFICATIONS
  );

  writeNotifications(nextNotifications);
  emitNotifications(nextNotifications);
};

export const subscribeToNotifications = (listener) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handleNotificationChange = (event) => {
    listener(event.detail || readNotifications());
  };

  window.addEventListener(NOTIFICATION_EVENT, handleNotificationChange);

  return () => {
    window.removeEventListener(NOTIFICATION_EVENT, handleNotificationChange);
  };
};

export const markAllNotificationsRead = () => {
  const nextNotifications = readNotifications().map((notification) => ({
    ...notification,
    isRead: true,
  }));

  writeNotifications(nextNotifications);
  emitNotifications(nextNotifications);

  return nextNotifications;
};

export const removeNotification = (notificationId) => {
  const nextNotifications = readNotifications().filter(
    (notification) => notification.id !== notificationId
  );

  writeNotifications(nextNotifications);
  emitNotifications(nextNotifications);

  return nextNotifications;
};
