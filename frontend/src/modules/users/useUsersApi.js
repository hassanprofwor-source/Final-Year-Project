import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useUsersApi = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/user/getusers`);
      setUsers(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, fetchUsers };
};
