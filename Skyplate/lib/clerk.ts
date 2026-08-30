export const clerkMessage = (errors: any, fallback = 'Something went wrong') =>
  errors?.fields?.code?.message ||
  errors?.fields?.password?.message ||
  errors?.fields?.identifier?.message ||
  errors?.fields?.emailAddress?.message ||
  errors?.global?.[0]?.message ||
  fallback;
