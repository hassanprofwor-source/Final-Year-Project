import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/order/getOrders`);
      setOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  return { orders, loading, fetchOrders, updateOrderStatus, deleteOrder };
};
