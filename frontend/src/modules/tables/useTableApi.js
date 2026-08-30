import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import { toast } from "react-toastify";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useTableApi = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/table/getTables`);
      setTables(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const addTable = async (tableData) => {
    if (!tableData.number || !tableData.capacity) {
      toast.info("Please add Table number and Table capacity!");
      return;
    }
    const formDataPayload = new FormData();
    formDataPayload.append("number", tableData.number);
    formDataPayload.append("capacity", tableData.capacity);

    await apiClient.post(`${apiUrl}/api/v1/table/saveTable`, formDataPayload, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Table addedd successfully!.");
    fetchTableData();
  };

  const updateTable = async (id, tableData) => {
    const formDataToSend = new FormData();
    formDataToSend.append("number", tableData.number);
    formDataToSend.append("capacity", tableData.capacity);

    await apiClient.put(`${apiUrl}/api/v1/table/updateTable/${id}`, formDataToSend, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Table updated Successfully");
    fetchTableData();
  };

  const deleteTable = async (id) => {
    try {
      await apiClient.delete(`${apiUrl}/api/v1/table/deleteTable/${id}`);
      toast.success("Table Deleted successfully!");
      fetchTableData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete table");
    }
  };

  return { tables, loading, fetchTableData, addTable, updateTable, deleteTable };
};
