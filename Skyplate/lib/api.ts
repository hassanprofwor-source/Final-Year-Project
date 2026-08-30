import axios from 'axios';
import { frontendUrl } from '@/constants/config';

export const api = axios.create({
  baseURL: frontendUrl,
  timeout: 15000,
});

export const apiErrorMessage = (error: any, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

export const ensureSkyplateUser = async (user: {
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress?: string } | null;
}) => {
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email || !frontendUrl) return;
  try {
    await api.get(`/api/v1/user/getuser/${email}`);
  } catch {
    await api.post('/api/v1/user/saveuser', {
      firstname: user.firstName || 'Guest',
      lastname: user.lastName || 'User',
      email,
    });
  }
};

