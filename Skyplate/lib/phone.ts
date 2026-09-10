export const formatPhone = (value: string) => {
  let formattedValue = value.replace(/\D/g, '').slice(0, 11);
  if (formattedValue.length > 4) {
    formattedValue = `${formattedValue.slice(0, 4)}-${formattedValue.slice(4)}`;
  }
  return formattedValue;
};

export const isValidPkPhone = (value: string) => value.length === 12;
