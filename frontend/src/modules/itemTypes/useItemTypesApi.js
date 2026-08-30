import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import { toast } from "react-toastify";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useItemTypesApi = () => {
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItemTypes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/itemType/getTypes`);
      setItemTypes(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemTypes();
  }, []);

  const addItemType = async (name) => {
    if (!name) {
      toast.info("Please enter a type name!");
      return;
    }
    const formDataPayload = new FormData();
    formDataPayload.append("name", name);

    await apiClient.post(`${apiUrl}/api/v1/itemType/addType`, formDataPayload, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Item type added successfully!");
    fetchItemTypes();
  };

  const updateItemType = async (id, name) => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", name);

    await apiClient.put(`${apiUrl}/api/v1/itemType/updateType/${id}`, formDataToSend, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Item type updated successfully!");
    fetchItemTypes();
  };

  const deleteItemType = async (id) => {
    try {
      await apiClient.delete(`${apiUrl}/api/v1/itemType/deleteType/${id}`);
      toast.success("Item type deleted successfully!");
      fetchItemTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item type");
    }
  };

  return { itemTypes, loading, fetchItemTypes, addItemType, updateItemType, deleteItemType };
};
