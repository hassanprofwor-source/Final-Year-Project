import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../lib/apiClient";

const apiUrl = import.meta.env.VITE_SERVER_URL;
const POLL_MS = 15000;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const knownIds = useRef(new Set());
  const primed = useRef(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/notifications`);
      const items = response.data.data || [];
      const nextUnread = response.data.unreadCount || 0;

      if (primed.current) {
        items
          .filter((item) => !item.read && !knownIds.current.has(item._id))
          .forEach((item) => {
            toast.info(`${item.title}: ${item.body}`, { autoClose: 5000 });
          });
      }

      knownIds.current = new Set(items.map((item) => item._id));
      primed.current = true;
      setNotifications(items);
      setUnreadCount(nextUnread);
    } catch {
      // Ignore poll failures so the dashboard stays usable.
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await apiClient.put(`${apiUrl}/api/v1/notifications/${id}/read`);
    setNotifications((current) =>
      current.map((item) => (item._id === id ? { ...item, read: true } : item))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    await apiClient.put(`${apiUrl}/api/v1/notifications/read-all`);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, markAllRead };
};
