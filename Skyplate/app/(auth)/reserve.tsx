import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useUser } from "@clerk/expo";
import Toast from "react-native-toast-message";
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from "@/theme/theme";
import { api, apiErrorMessage } from "@/lib/api";
import { useStore } from "@/store/store";

const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);

const formatDate = (date: Date) =>
  `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

const nextDays = (count: number) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(formatDate(date));
  }
  return days;
};

const timeSlotsForDate = (slots: string[], selectedDate: string) => {
  const now = new Date();
  const today = formatDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.filter((slot) => {
    if (selectedDate !== today) return true;
    const [hour, minute] = slot.split(":").map(Number);
    return hour * 60 + (minute || 0) > currentMinutes;
  });
};

const DEFAULT_TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${pad(i + 12)}:00`);

const ReserveScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const fetchTableData = useStore((state: any) => state.fetchTableData);
  const TablesList = useStore((state: any) => state.TablesList);
  const dates = useMemo(() => nextDays(7), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [takenTables, setTakenTables] = useState<number[]>([]);
  const [configuredSlots, setConfiguredSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);

  const timeSlots = useMemo(
    () => timeSlotsForDate(configuredSlots, selectedDate),
    [configuredSlots, selectedDate]
  );

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        const response = await api.get("/api/v1/timeslot/getTimeSlots");
        const times = (response.data.data || [])
          .map((slot: any) => (typeof slot === "string" ? slot : slot.time))
          .filter(Boolean);
        if (times.length) setConfiguredSlots(times);
      } catch {
        setConfiguredSlots(DEFAULT_TIME_SLOTS);
      }
    };
    loadSlots();
  }, []);

  useEffect(() => {
    setSelectedTime(timeSlots[0] || "");
    setSelectedTable(null);
  }, [selectedDate, timeSlots]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedDate || !selectedTime) return;
      try {
        const response = await api.get(
          `/api/v1/booking/availability?date=${selectedDate}&time=${selectedTime}`
        );
        setTakenTables(response.data.data || []);
      } catch {
        setTakenTables([]);
      }
    };
    loadAvailability();
    setSelectedTable(null);
  }, [selectedDate, selectedTime]);

  const handleReserve = async () => {
    const people = parseInt(peopleCount, 10);
    if (!selectedDate || !selectedTime || !selectedTable || !people) {
      Toast.show({ type: "error", text1: "Please choose date, time, guests and a table" });
      return;
    }

    try {
      await api.post("/api/v1/booking/saveBooking", {
        date: selectedDate,
        time: selectedTime,
        tableNumber: selectedTable,
        people,
        email: user?.primaryEmailAddress?.emailAddress,
        status: "Pending",
      });
      Toast.show({
        type: "success",
        text1: "Reservation requested",
        text2: "Wait for the restaurant to confirm your table.",
      });
      router.replace("/bookings");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not reserve",
        text2: apiErrorMessage(error, "Could not reserve"),
      });
    }
  };

  return (
    <Screen>
      <StackHeader title="Reserve a table" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[styles.chip, selectedDate === date && styles.chipActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={styles.chipText}>{date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Time</Text>
        {timeSlots.length === 0 ? (
          <Text style={styles.tableSub}>No time slots left for this date.</Text>
        ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.chip, selectedTime === slot && styles.chipActive]}
              onPress={() => setSelectedTime(slot)}
            >
              <Text style={styles.chipText}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        )}

        <TextField
          label="Number of guests"
          keyboardType="numeric"
          placeholder="e.g. 4"
          value={peopleCount}
          onChangeText={setPeopleCount}
        />

        <Text style={styles.label}>Tables</Text>
        <View style={styles.tableGrid}>
          {(TablesList || []).map((table: any) => {
            const count = parseInt(peopleCount || "0", 10);
            const taken = takenTables.includes(table.number);
            const tooSmall = count > 0 && table.capacity < count && !(count >= 11 && count <= 15 && table.capacity === 10);
            const disabled = taken || tooSmall;
            return (
              <TouchableOpacity
                key={table._id || table.number}
                disabled={disabled}
                onPress={() => setSelectedTable(table.number)}
                style={[
                  styles.tableCard,
                  selectedTable === table.number && styles.tableActive,
                  disabled && styles.tableDisabled,
                ]}
              >
                <MaterialCommunityIcons
                  name="table-furniture"
                  size={28}
                  color={selectedTable === table.number ? COLORS.primaryRedHex : COLORS.White}
                />
                <Text style={styles.tableText}>T{table.number}</Text>
                <Text style={styles.tableSub}>{table.capacity} seats</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button title="Request reservation" onPress={handleReserve} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: SPACING.space_20, paddingBottom: 40 },
  label: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chipRow: { flexGrow: 0, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.elevated,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primaryRedHex, borderColor: COLORS.primaryRedHex },
  chipText: { color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.medium },
  tableGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8, marginBottom: 24 },
  tableCard: {
    width: 72,
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.elevated,
  },
  tableActive: { borderColor: COLORS.primaryRedHex },
  tableDisabled: { opacity: 0.35 },
  tableText: { color: COLORS.primaryWhiteHex, marginTop: 4, fontFamily: FONTFAMILY.medium },
  tableSub: { color: COLORS.primaryLightGreyHex, fontSize: 12 },
});

export default ReserveScreen;
