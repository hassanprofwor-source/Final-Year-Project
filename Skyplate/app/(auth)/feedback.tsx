import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/expo';
import Toast from 'react-native-toast-message';
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { api, apiErrorMessage } from '@/lib/api';

const formatPhone = (value: string) => {
  let formattedValue = value.replace(/\D/g, '').slice(0, 11);
  if (formattedValue.length > 4) {
    formattedValue = `${formattedValue.slice(0, 4)}-${formattedValue.slice(4)}`;
  }
  return formattedValue;
};

const Feedback = () => {
  const { firstname, phone, imgurl } = useLocalSearchParams();
  const { user } = useUser();
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [hasPendingFeedback, setHasPendingFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    feedback: '',
  });

  const fetchUserData = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    try {
      setFormData({
        phoneNumber: String(phone || ''),
        email: email || '',
        feedback: '',
      });
      const response = await api.get(`/api/v1/feedback/myfeedback/${email}`);
      if (response.data && response.data.success !== false) {
        const allFeedbacks = response.data.data || [];
        const pendingFeedback = allFeedbacks.find(
          (item: any) => item.email === email && item.completed === false,
        );
        setHasPendingFeedback(!!pendingFeedback);
      } else {
        setHasPendingFeedback(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        Toast.show({ type: 'success', text1: 'Feedback', text2: 'Feel free to send feedback.' });
        setHasPendingFeedback(false);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(err, 'Failed to fetch feedback') });
      }
    }
  };

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) fetchUserData();
  }, [user]);

  const handleFeedback = async () => {
    if (!formData.phoneNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Phone number is required' });
      return;
    }
    if (formData.phoneNumber.length !== 12) {
      setError('Use format 0300-1234567');
      return;
    }
    if (!formData.feedback.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Feedback cannot be empty' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('firstname', String(firstname || ''));
      payload.append('feedback', formData.feedback);
      payload.append('phone', formData.phoneNumber);
      payload.append('image', String(imgurl || ''));
      payload.append('email', formData.email);
      payload.append('rating', String(rating));

      await api.post('/api/v1/feedback/savefeedback', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Toast.show({
        type: 'success',
        text1: 'Feedback sent',
        text2: 'Submitted successfully. Wait for a response.',
      });
      setFormData({ phoneNumber: formData.phoneNumber, email: formData.email, feedback: '' });
      fetchUserData();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(err, 'Failed to submit feedback') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <StackHeader title="Feedback" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Email" value={formData.email} editable={false} />
        <TextField
          label="Phone (0300-1234567)"
          value={formData.phoneNumber}
          error={error}
          keyboardType="phone-pad"
          maxLength={12}
          editable={!hasPendingFeedback}
          onChangeText={(value) => {
            setFormData((prev) => ({ ...prev, phoneNumber: formatPhone(value) }));
            setError('');
          }}
        />
        <Text style={styles.label}>Rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity key={value} onPress={() => !hasPendingFeedback && setRating(value)}>
              <Text style={[styles.star, value <= rating && styles.starActive]}>
                {value <= rating ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextField
          label="Your feedback"
          placeholder="How was your visit?"
          value={formData.feedback}
          multiline
          editable={!hasPendingFeedback}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, feedback: value }))}
        />
        {hasPendingFeedback ? (
          <Text style={styles.warning}>
            You already have pending feedback. Wait for a response before sending another.
          </Text>
        ) : null}
        <Button
          title="Send feedback"
          onPress={handleFeedback}
          loading={submitting}
          disabled={hasPendingFeedback}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_32,
  },
  label: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.space_16,
  },
  star: {
    fontSize: 28,
    color: COLORS.primaryLightGreyHex,
  },
  starActive: {
    color: COLORS.Yellow,
  },
  warning: {
    color: COLORS.primaryRedHex,
    textAlign: 'center',
    fontFamily: FONTFAMILY.regular,
    marginBottom: SPACING.space_16,
  },
});

export default Feedback;
