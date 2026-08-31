import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../lib/apiClient";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useUsersApi = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/user/getusers`);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (id, payload) => {
    try {
      const response = await apiClient.put(`${apiUrl}/api/v1/user/admin/${id}`, payload);
      toast.success(response.data.message || "User updated successfully.");
      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      await apiClient.delete(`${apiUrl}/api/v1/user/admin/${id}`);
      toast.success("User deleted successfully.");
      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  return { users, loading, fetchUsers, updateUser, deleteUser };
};
