import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/expo';
import Toast from 'react-native-toast-message';
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { api, apiErrorMessage } from '@/lib/api';
import { formatPhone, isValidPkPhone } from '@/lib/phone';

const EditProfile = () => {
  const { address, firstname, lastname, gender, phone, imgurl } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    gender: '',
    address: '',
    userimage: '',
  });

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    setFormData({
      firstName: String(firstname || ''),
      lastName: String(lastname || ''),
      phoneNumber: String(phone || ''),
      email: user.primaryEmailAddress.emailAddress,
      gender: String(gender || ''),
      address: String(address || ''),
      userimage: String(imgurl || ''),
    });
  }, [user, firstname, lastname, phone, gender, address, imgurl]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!isValidPkPhone(formData.phoneNumber)) {
      setError('Use format 0300-1234567');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Toast.show({ type: 'error', text1: 'Missing info', text2: 'First and last name are required' });
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      if (formData.userimage && formData.userimage !== imgurl) {
        payload.append('userimage', {
          uri: formData.userimage,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }
      payload.append('firstname', formData.firstName);
      payload.append('lastname', formData.lastName);
      payload.append('gender', formData.gender);
      payload.append('address', formData.address);
      payload.append('phone', formData.phoneNumber);

      await api.post(`/api/v1/user/updateuser/${formData.email}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (user && (user.firstName !== formData.firstName || user.lastName !== formData.lastName)) {
        await user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }

      Toast.show({ type: 'success', text1: 'Details updated', text2: 'Your profile has been saved.' });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, userimage: result.assets[0].uri }));
    }
  };

  return (
    <Screen>
      <StackHeader title="Edit profile" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarWrap} onPress={handleSelectImage}>
          {formData.userimage ? (
            <Image source={{ uri: formData.userimage }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Upload photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label="First name"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label="Last name"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
            />
          </View>
        </View>
        <TextField
          label="Phone (0300-1234567)"
          value={formData.phoneNumber}
          error={error}
          keyboardType="phone-pad"
          maxLength={12}
          onChangeText={(value) => {
            handleInputChange('phoneNumber', formatPhone(value));
            setError('');
          }}
        />
        <TextField label="Email" value={formData.email} editable={false} />
        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.gender}
            onValueChange={(value) => handleInputChange('gender', value)}
            dropdownIconColor={COLORS.White}
            style={styles.picker}
          >
            <Picker.Item label="Select gender" value="" color={COLORS.primaryLightGreyHex} />
            <Picker.Item label="Male" value="male" color={COLORS.White} />
            <Picker.Item label="Female" value="female" color={COLORS.White} />
            <Picker.Item label="Other" value="other" color={COLORS.White} />
          </Picker>
        </View>
        <TextField
          label="Address"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
        />
        <Button title="Save" onPress={handleSave} loading={saving} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_32,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.space_12,
  },
  half: {
    flex: 1,
  },
  label: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pickerWrap: {
    marginBottom: SPACING.space_16,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.White,
  },
});

export default EditProfile;
