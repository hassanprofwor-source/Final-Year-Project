import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import Toast from 'react-native-toast-message';
import Screen from '@/components/ui/Screen';
import BrandMark from '@/components/ui/BrandMark';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { clerkMessage } from '@/lib/clerk';

const Login = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsTrust, setNeedsTrust] = useState(false);

  const finishSignIn = async () => {
    await signIn.finalize();
  };

  const onSignInPress = async () => {
    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: clerkMessage(errors, 'Check your email and password'),
      });
      return;
    }

    if (signIn.status === 'complete') {
      await finishSignIn();
      return;
    }

    if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      const emailFactor = signIn.supportedSecondFactors?.find((factor: any) => factor.strategy === 'email_code');
      if (emailFactor) await signIn.mfa.sendEmailCode();
      setNeedsTrust(true);
      Toast.show({ type: 'info', text1: 'Verify this device', text2: 'We sent a code to your email' });
      return;
    }

    Toast.show({ type: 'error', text1: 'Sign in failed', text2: 'Complete any extra verification steps and try again' });
  };

  const onVerifyTrust = async () => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      Toast.show({ type: 'error', text1: 'Verification failed', text2: clerkMessage(errors, 'Check the code') });
      return;
    }
    if (signIn.status === 'complete') await finishSignIn();
  };

  const loading = fetchStatus === 'fetching';

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Spinner visible={loading} />
          <BrandMark size="lg" />
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.title}>{needsTrust ? 'Verify this device' : 'Sign in to Skyplate'}</Text>
          {needsTrust ? (
            <>
              <TextField label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" />
              <Button title="Verify" onPress={onVerifyTrust} loading={loading} />
            </>
          ) : (
            <>
              <TextField
                label="Email"
                placeholder="you@email.com"
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextField
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Link href="/reset" style={styles.linkWrap}>
                <Text style={styles.link}>Forgot password?</Text>
              </Link>
              <Button title="Sign in" onPress={onSignInPress} loading={loading} />
              <Text style={styles.footer}>
                Don’t have an account?{' '}
                <Text style={styles.signup} onPress={() => router.push('/register')}>
                  Create one
                </Text>
              </Text>
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
  linkWrap: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.space_20,
  },
  link: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
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

export default Login;
