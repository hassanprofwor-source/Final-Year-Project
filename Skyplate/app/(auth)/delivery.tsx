import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { api, apiErrorMessage } from '@/lib/api';
import { formatPhone, isValidPkPhone } from '@/lib/phone';
import { useStore } from '@/store/store';
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';

const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);
const formatDate = (date: Date) =>
  `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
const DEFAULT_TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${pad(i + 12)}:00`);

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
    const [hour, minute] = slot.split(':').map(Number);
    return hour * 60 + (minute || 0) > currentMinutes;
  });
};

const Delivery = () => {
  const { orderType, isDelivery } = useLocalSearchParams();
  const delivery = isDelivery === 'true';
  const { user } = useUser();
  const router = useRouter();
  const fetchTableData = useStore((state: any) => state.fetchTableData);
  const TablesList = useStore((state: any) => state.TablesList);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState(delivery ? '' : 'Dine-in at Skyplate');
  const [error, setError] = useState('');

  const dates = useMemo(() => nextDays(3), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [takenTables, setTakenTables] = useState<number[]>([]);
  const [configuredSlots, setConfiguredSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const timeSlots = useMemo(
    () => timeSlotsForDate(configuredSlots, selectedDate),
    [configuredSlots, selectedDate],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/api/v1/user/getuser/${user?.primaryEmailAddress?.emailAddress}`);
        const data = response.data.data[0];
        setPhoneNumber(data?.phone || '');
        if (delivery) setAddress(data?.address || '');
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(err) });
      }
    };
    if (user?.primaryEmailAddress?.emailAddress) load();
  }, [user, delivery]);

  useEffect(() => {
    if (delivery) return;
    fetchTableData();
  }, [delivery, fetchTableData]);

  useEffect(() => {
    if (delivery) return;
    const loadSlots = async () => {
      try {
        const response = await api.get('/api/v1/timeslot/getTimeSlots');
        const times = (response.data.data || [])
          .map((slot: any) => (typeof slot === 'string' ? slot : slot.time))
          .filter(Boolean);
        if (times.length) setConfiguredSlots(times);
      } catch {
        setConfiguredSlots(DEFAULT_TIME_SLOTS);
      }
    };
    loadSlots();
  }, [delivery]);

  useEffect(() => {
    if (delivery) return;
    setSelectedTime(timeSlots[0] || '');
    setSelectedTable(null);
  }, [delivery, selectedDate, timeSlots]);

  useEffect(() => {
    if (delivery || !selectedDate || !selectedTime) return;
    const loadAvailability = async () => {
      try {
        const response = await api.get(
          `/api/v1/booking/availability?date=${selectedDate}&time=${selectedTime}`,
        );
        setTakenTables(response.data.data || []);
      } catch {
        setTakenTables([]);
      }
    };
    loadAvailability();
    setSelectedTable(null);
  }, [delivery, selectedDate, selectedTime]);

  const handleContinue = () => {
    if (!isValidPkPhone(phoneNumber)) {
      setError('Use format 0300-1234567');
      return;
    }
    if (delivery && !address.trim()) {
      Toast.show({ type: 'error', text1: 'Address required' });
      return;
    }
    if (!delivery) {
      const people = parseInt(peopleCount, 10);
      if (!selectedDate || !selectedTime || !selectedTable || !people) {
        Toast.show({
          type: 'error',
          text1: 'Choose seating',
          text2: 'Select date, time, guests, and a table for dine-in.',
        });
        return;
      }
    }

    router.push({
      pathname: '/payment',
      params: {
        orderType,
        phone: phoneNumber,
        address: delivery ? address : 'Dine-in at Skyplate',
        ...(!delivery
          ? {
              date: selectedDate,
              time: selectedTime,
              people: String(peopleCount),
              tableNumber: String(selectedTable),
            }
          : {}),
      },
    });
  };

  return (
    <Screen>
      <StackHeader title={delivery ? 'Delivery details' : 'Dine-in details'} />
      <ScrollView contentContainerStyle={styles.content}>
        <TextField
          label="Phone"
          value={phoneNumber}
          error={error}
          keyboardType="phone-pad"
          onChangeText={(v) => {
            setPhoneNumber(formatPhone(v));
            setError('');
          }}
        />
        {delivery ? (
          <TextField
            label="Address"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        ) : (
          <>
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

            <Text style={styles.label}>Table</Text>
            <View style={styles.tableGrid}>
              {(TablesList || []).map((table: any) => {
                const count = parseInt(peopleCount || '0', 10);
                const taken = takenTables.includes(table.number);
                const tooSmall = count > 0 && table.capacity < count;
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
          </>
        )}
        <Button title="Continue to payment" onPress={handleContinue} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.space_20,
    backgroundColor: COLORS.Black,
    paddingBottom: 40,
  },
  label: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, marginBottom: 24 },
  tableCard: {
    width: 72,
    alignItems: 'center',
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

export default Delivery;
