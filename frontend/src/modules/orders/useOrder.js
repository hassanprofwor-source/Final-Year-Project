import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useOrder = (id) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/order/getOrderById/${id}`);
      setOrder(response.data.data || null);
    } catch (error) {
      console.error("Error fetching order", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await apiClient.get(`${apiUrl}/api/v1/order/getOrderById/${id}`);
        if (!cancelled) setOrder(response.data.data || null);
      } catch (error) {
        console.error("Error fetching order", error);
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateOrderStatus = async (orderId, newStatus) => {
    await apiClient.put(`${apiUrl}/api/v1/order/updateOrder/${orderId}`, { status: newStatus });
    await fetchOrder();
  };

  const deleteOrder = async (orderId) => {
    await apiClient.delete(`${apiUrl}/api/v1/order/deleteOrder/${orderId}`);
  };

  return { order, loading, fetchOrder, updateOrderStatus, deleteOrder };
};
