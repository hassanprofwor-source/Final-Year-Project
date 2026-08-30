import { StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useSignIn } from '@clerk/expo';
import { Link } from 'expo-router';
import Toast from 'react-native-toast-message';
import Screen from '@/components/ui/Screen';
import BrandMark from '@/components/ui/BrandMark';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import StackHeader from '@/components/ui/StackHeader';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { clerkMessage } from '@/lib/clerk';

const PwReset = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const { signIn, errors, fetchStatus } = useSignIn();

  const onRequestReset = async () => {
    const { error: createError } = await signIn.create({ identifier: emailAddress });
    if (createError) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: clerkMessage(errors, 'Try again') });
      return;
    }
    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (error) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: clerkMessage(errors, 'Try again') });
      return;
    }
    setSuccessfulCreation(true);
    Toast.show({ type: 'success', text1: 'Code sent', text2: 'Check your email' });
  };

  const onReset = async () => {
    const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (verifyError) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: clerkMessage(errors, 'Check the code') });
      return;
    }

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (error) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: clerkMessage(errors, 'Try again') });
      return;
    }

    Toast.show({ type: 'success', text1: 'Password updated' });
    if (signIn.status === 'complete') await signIn.finalize();
  };

  const loading = fetchStatus === 'fetching';

  return (
    <Screen>
      <StackHeader title="Reset password" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandMark size="md" />
          <Text style={styles.title}>{successfulCreation ? 'Enter the new password' : 'Forgot your password?'}</Text>
          {!successfulCreation ? (
            <>
              <TextField label="Email" autoCapitalize="none" value={emailAddress} onChangeText={setEmailAddress} />
              <Button title="Send code" onPress={onRequestReset} loading={loading} />
            </>
          ) : (
            <>
              <TextField label="Code" value={code} onChangeText={setCode} />
              <TextField label="New password" secureTextEntry value={password} onChangeText={setPassword} />
              <Button title="Update password" onPress={onReset} loading={loading} />
            </>
          )}
          <Link href="/login" style={{ marginTop: 20 }}>
            <Text style={styles.back}>Back to sign in</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.space_24,
  },
  title: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_24,
    marginVertical: SPACING.space_24,
  },
  back: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    textAlign: 'center',
  },
});

export default PwReset;
