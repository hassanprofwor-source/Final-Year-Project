import { StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSignUp } from '@clerk/expo';
import Spinner from 'react-native-loading-spinner-overlay';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  handleEmailChange,
  handleFirstNameChange,
  handleLastNameChange,
  handlePasswordChange,
  handleSignUp,
} from '@/Controllers/SignupController/HandleState';
import Toast from 'react-native-toast-message';
import { api, apiErrorMessage } from '@/lib/api';
import Screen from '@/components/ui/Screen';
import BrandMark from '@/components/ui/BrandMark';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { clerkMessage } from '@/lib/clerk';

const Register = () => {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const onSignUpPress = async () => {
    const isValid = handleSignUp(
      firstName,
      lastName,
      emailAddress,
      password,
      setFirstNameError,
      setLastNameError,
      setEmailError,
      setPasswordError,
    );
    if (!isValid) return;

    const { error } = await signUp.password({
      emailAddress,
      password,
      firstName,
      lastName,
    });
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Sign up failed',
        text2: clerkMessage(errors, 'Try again'),
      });
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      Toast.show({ type: 'error', text1: 'Could not send code', text2: clerkMessage(errors, 'Try again') });
      return;
    }
    setPendingVerification(true);
  };

  const onPressVerify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: clerkMessage(errors, 'Check the code and try again'),
      });
      return;
    }

    try {
      await api.post('/api/v1/user/saveuser', {
        firstname: firstName,
        lastname: lastName,
        email: emailAddress,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Profile sync failed',
        text2: apiErrorMessage(err, 'Account is verified. You can finish your profile later.'),
      });
    }

    if (signUp.status === 'complete') {
      await signUp.finalize();
    }
  };

  const loading = fetchStatus === 'fetching';

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Spinner visible={loading} />
          <BrandMark size="lg" />
          <Text style={styles.eyebrow}>{pendingVerification ? 'Verify email' : 'Join Skyplate'}</Text>
          <Text style={styles.title}>
            {pendingVerification ? 'Enter your code' : 'Create an account'}
          </Text>

          {!pendingVerification ? (
            <>
              <TextField label="First name" value={firstName} error={firstNameError} onChangeText={(t) => handleFirstNameChange(t, setFirstName, setFirstNameError)} />
              <TextField label="Last name" value={lastName} error={lastNameError} onChangeText={(t) => handleLastNameChange(t, setLastName, setLastNameError)} />
              <TextField label="Email" autoCapitalize="none" value={emailAddress} error={emailError} onChangeText={(t) => handleEmailChange(t, setEmailAddress, setEmailError)} />
              <TextField
                label="Password"
                placeholder="At least 8 characters"
                secureTextEntry
                value={password}
                error={passwordError}
                onChangeText={(t) => handlePasswordChange(t, setPassword, setPasswordError)}
              />
              <Button title="Create account" onPress={onSignUpPress} loading={loading} />
              <Text style={styles.footer}>
                Already have an account?{' '}
                <Text style={styles.signup} onPress={() => router.push('/login')}>
                  Sign in
                </Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.hint}>We sent a verification code to {emailAddress}</Text>
              <TextField label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" />
              <Button title="Verify" onPress={onPressVerify} loading={loading} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.space_24,
    paddingTop: SPACING.space_36,
  },
  eyebrow: {
    marginTop: SPACING.space_32,
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_28,
    marginTop: SPACING.space_8,
    marginBottom: SPACING.space_24,
  },
  hint: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.regular,
    marginBottom: SPACING.space_16,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_24,
    fontFamily: FONTFAMILY.regular,
  },
  signup: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
  },
});

export default Register;
