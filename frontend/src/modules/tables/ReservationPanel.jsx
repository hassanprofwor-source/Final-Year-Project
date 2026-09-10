import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { MdOutlineTableRestaurant, MdTableRestaurant } from "react-icons/md";
import Section from "../../components/ui/Section";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import Badge from "../../components/ui/Badge";
import { inputClass } from "../../components/ui/FormField";
import { useBookings } from "./useBookings";
import apiClient from "../../lib/apiClient";
import { DEFAULT_TIME_SLOTS, slotTimes } from "../timeslots/useTimeSlotApi";

const apiUrl = import.meta.env.VITE_SERVER_URL;

const pad = (value) => (value < 10 ? `0${value}` : `${value}`);

const formatDisplayDate = (date) =>
  `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

const toInputDate = (displayDate) => {
  const [day, month, year] = displayDate.split("-");
  return `${year}-${month}-${day}`;
};

const fromInputDate = (inputDate) => {
  const [year, month, day] = inputDate.split("-");
  return `${day}-${month}-${year}`;
};

const filterSlotsForDate = (slots, selectedDate) => {
  const now = new Date();
  const today = formatDisplayDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.filter((slot) => {
    if (selectedDate !== today) return true;
    const [hour, minute] = String(slot).split(":").map(Number);
    return hour * 60 + (minute || 0) > currentMinutes;
  });
};

const statusTone = {
  Pending: "pending",
  Confirmed: "accepted",
  Cancelled: "rejected",
};

const ReservationPanel = ({ tables }) => {
  const { bookings, saveBooking, updateBooking } = useBookings();
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [peopleCount, setPeopleCount] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [timeArray, setTimeArray] = useState([]);
  const [visibleTables, setVisibleTables] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDisplayDate(new Date()));
  const [guestEmail, setGuestEmail] = useState("");
  const [configuredSlots, setConfiguredSlots] = useState(DEFAULT_TIME_SLOTS);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        const response = await apiClient.get(`${apiUrl}/api/v1/timeslot/getTimeSlots`);
        const times = slotTimes(response.data.data);
        if (times.length) setConfiguredSlots(times);
      } catch {
        setConfiguredSlots(DEFAULT_TIME_SLOTS);
      }
    };
    loadSlots();
  }, []);

  useEffect(() => {
    const slots = filterSlotsForDate(configuredSlots, selectedDate);
    setTimeArray(slots);
    setSelectedTime(slots[0] || "");
  }, [selectedDate, configuredSlots]);

  const isBooked = (tableNumber) =>
    bookings.some(
      (booking) =>
        booking.status !== "Cancelled" &&
        booking.tableNumber === tableNumber &&
        booking.date === selectedDate &&
        booking.time === selectedTime
    );

  useEffect(() => {
    setSelectedTableNumber(null);

    if (!peopleCount || !selectedTime) {
      setVisibleTables(tables.map((table) => ({ ...table, visible: false })));
      return;
    }

    const count = parseInt(peopleCount);

    if (count > 15) {
      toast.warning("The number of people exceeds the table limit. Please visit Skyplate for Hall Reservations.");
      setVisibleTables(tables.map((table) => ({ ...table, visible: false })));
      return;
    }

    const updated = tables.map((table) => {
      const booked = isBooked(table.number);
      let isOverCapacity = false;

      if (count <= 10) {
        isOverCapacity = count > table.capacity;
      } else if (count >= 11 && count <= 14) {
        isOverCapacity = count > table.capacity && table.capacity !== 10;
      }

      const isTooUndersized = count + 2 <= table.capacity;
      const visible = !booked && !isOverCapacity && !isTooUndersized;

      return { ...table, visible };
    });

    setVisibleTables(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleCount, selectedTime, selectedDate, bookings, tables]);

  const upcoming = useMemo(
    () => bookings.filter((booking) => booking.status !== "Cancelled"),
    [bookings]
  );

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!selectedTime || !selectedTableNumber || !selectedDate) {
      toast.info("Please choose date, time and table!");
      return;
    }
    try {
      await saveBooking({
        date: selectedDate,
        time: selectedTime,
        tableNumber: selectedTableNumber,
        people: peopleCount,
        email: guestEmail,
        status: "Confirmed",
      });
      setSelectedTableNumber(null);
      setPeopleCount("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reserve table");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title="Book a Table" description="Reserve a table for a walk-in, phone booking, or upcoming date.">
        <div className="mb-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-white/80" />
            <span className="text-sm text-white">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-red" />
            <span className="text-sm text-white">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-green" />
            <span className="text-sm text-white">Selected</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="date"
            min={toInputDate(formatDisplayDate(new Date()))}
            value={toInputDate(selectedDate)}
            onChange={(e) => setSelectedDate(fromInputDate(e.target.value))}
            className={inputClass}
          />
          <input
            placeholder="Customer email (optional)"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            type="email"
            className={inputClass}
          />
          <input
            onKeyPress={(event) => {
              if (!/[0-9]/.test(event.key)) event.preventDefault();
            }}
            placeholder="Number of People"
            value={peopleCount}
            onChange={(e) => setPeopleCount(e.target.value)}
            type="number"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleTables.map((table) => {
            const booked = isBooked(table.number);
            const count = parseInt(peopleCount || "0");
            const isExceptionCase = count >= 11 && count <= 15 && table.capacity === 10;
            const isDisabled = booked || !table.visible || (table.capacity < count && !isExceptionCase);

            return (
              <div
                key={table._id}
                onClick={() => !isDisabled && setSelectedTableNumber(table.number)}
                className={`flex flex-col items-center rounded-xl border border-white/8 bg-elevated p-4 transition-all duration-200 ${
                  isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-red/40"
                }`}
              >
                {booked ? (
                  <MdTableRestaurant size={40} className="text-red" />
                ) : (
                  <MdOutlineTableRestaurant
                    size={40}
                    className={selectedTableNumber === table.number ? "text-green" : "text-white"}
                  />
                )}
                <span className="mt-2 text-gray">Table {table.number}</span>
                <span className="text-xs text-gray">Capacity: {table.capacity}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          {timeArray.length === 0 ? (
            <p className="text-sm text-gray">No time slots available for this date.</p>
          ) : (
            <Tabs
              tabs={timeArray.map((t) => ({ value: t, label: t }))}
              active={selectedTime}
              onChange={setSelectedTime}
            />
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleReserve}
            disabled={!selectedTime || !selectedTableNumber || !peopleCount}
            className="disabled:opacity-40"
          >
            Reserve Table
          </Button>
        </div>
      </Section>

      <Section title="Upcoming reservations" description="Confirm or cancel customer bookings.">
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray">No upcoming reservations.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <div
                key={booking._id}
                className="flex flex-col gap-3 rounded-xl border border-white/8 bg-elevated p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">
                    Table {booking.tableNumber} · {booking.date} · {booking.time}
                  </p>
                  <p className="text-sm text-gray">
                    {booking.people} guests{booking.email ? ` · ${booking.email}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {booking.paymentStatus === "paid" ? (
                    <Badge tone="completed">£10 paid — deduct from bill</Badge>
                  ) : (
                    <Badge tone="neutral">Fee waived</Badge>
                  )}
                  <Badge tone={statusTone[booking.status] || "neutral"}>{booking.status}</Badge>
                  {booking.status === "Pending" && (
                    <Button onClick={() => updateBooking(booking._id, "Confirmed")}>Confirm</Button>
                  )}
                  {booking.status !== "Cancelled" && (
                    <Button variant="outline" onClick={() => updateBooking(booking._id, "Cancelled")}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default ReservationPanel;
