import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import { toast } from "react-toastify";

const apiUrl = import.meta.env.VITE_SERVER_URL;

const pad = (value) => (value < 10 ? `0${value}` : `${value}`);

export const DEFAULT_TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${pad(i + 12)}:00`);

export const slotTimes = (slots) =>
  (slots || []).map((slot) => (typeof slot === "string" ? slot : slot.time)).filter(Boolean);

export const useTimeSlotApi = () => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/timeslot/getAllTimeSlots`);
      setTimeSlots(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const addTimeSlot = async (slotData) => {
    if (!slotData.time) {
      toast.info("Please choose a time.");
      return;
    }
    await apiClient.post(`${apiUrl}/api/v1/timeslot/saveTimeSlot`, {
      time: slotData.time,
      enabled: slotData.enabled !== false,
    });
    toast.success("Time slot added.");
    fetchTimeSlots();
  };

  const updateTimeSlot = async (id, slotData) => {
    await apiClient.put(`${apiUrl}/api/v1/timeslot/updateTimeSlot/${id}`, {
      time: slotData.time,
      enabled: slotData.enabled,
    });
    toast.success("Time slot updated.");
    fetchTimeSlots();
  };

  const deleteTimeSlot = async (id) => {
    try {
      await apiClient.delete(`${apiUrl}/api/v1/timeslot/deleteTimeSlot/${id}`);
      toast.success("Time slot deleted.");
      fetchTimeSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete time slot");
    }
  };

  return { timeSlots, loading, fetchTimeSlots, addTimeSlot, updateTimeSlot, deleteTimeSlot };
};
