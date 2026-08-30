// validation.js
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+92-\d{10}$/;
    return phoneRegex.test(phoneNumber);
};

export const validatePassword = (password) => {
    return typeof password === 'string' && password.length >= 8;
};
