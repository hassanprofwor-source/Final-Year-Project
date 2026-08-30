import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import { toast } from "react-toastify";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/booking/getBookings`);
      setBookings(response.data.data || []);
    } catch (error) {
      console.error(error);
      setBookings([]);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const saveBooking = async ({ date, time, tableNumber, people, email, status }) => {
    await apiClient.post(`${apiUrl}/api/v1/booking/saveBooking`, {
      date,
      time,
      tableNumber,
      people,
      email,
      status,
    });

    toast.success("Table booked successfully!");
    fetchBookings();
  };

  const updateBooking = async (id, status) => {
    await apiClient.put(`${apiUrl}/api/v1/booking/updateBooking/${id}`, { status });
    toast.success(`Booking ${status.toLowerCase()}.`);
    fetchBookings();
  };

  return { bookings, fetchBookings, saveBooking, updateBooking };
};
