import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import { orderListParams } from "./orderListParams";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useOrders = (filters = {}) => {
  const { orderType, status, search, time } = filters;
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({ Pending: 0, Accepted: 0, Completed: 0 });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/order/getOrders`, {
        params: orderListParams({ orderType, status, search, time }),
      });
      setOrders(response.data.data || []);
      if (response.data.counts) setCounts(response.data.counts);
    } catch (error) {
      console.error("Error fetching orders", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`${apiUrl}/api/v1/order/getOrders`, {
          params: orderListParams({ orderType, status, search, time }),
        });
        if (cancelled) return;
        setOrders(response.data.data || []);
        if (response.data.counts) setCounts(response.data.counts);
      } catch (error) {
        console.error("Error fetching orders", error);
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderType, status, search, time]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.put(`${apiUrl}/api/v1/order/updateOrder/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status", error);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await apiClient.delete(`${apiUrl}/api/v1/order/deleteOrder/${orderId}`);
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order", error);
    }
  };

  return { orders, counts, loading, fetchOrders, updateOrderStatus, deleteOrder };
};
