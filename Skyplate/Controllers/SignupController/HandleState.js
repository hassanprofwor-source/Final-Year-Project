// stateManagement.js
import { validateEmail, validatePhoneNumber, validatePassword } from './HandleValidations';

export const handleUsernameChange = (username, setUsername, setUsernameError) => {
    setUsername(username);
    setUsernameError(username === '' ? 'Username is required.' : '');
};

export const handleFirstNameChange = (firstName, setFirstName, setFirstNameError) => {
    setFirstName(firstName);
    setFirstNameError(firstName === '' ? 'First Name is required.' : '');
};

export const handleLastNameChange = (lastName, setLastName, setLastNameError) => {
    setLastName(lastName);
    setLastNameError(lastName === '' ? 'Last Name is required.' : '');
};

export const handleEmailChange = (email, setEmail, setEmailError) => {
    setEmail(email);
    if (email === '') {
        setEmailError('Email is required.');
    } else if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address.');
    } else {
        setEmailError('');
    }
};

export const handlePhoneNumberChange = (phoneNumber, setPhoneNumber, setPhoneError) => {
    setPhoneNumber(phoneNumber);
    if (phoneNumber === '') {
        setPhoneError('Phone number is required.');
    } else if (!validatePhoneNumber(phoneNumber)) {
        setPhoneError('Phone number must be in +92-0000000000 format.');
    } else {
        setPhoneError('');
    }
};

export const handlePasswordChange = (password, setPassword, setPasswordError) => {
    setPassword(password);
    if (password === '') {
        setPasswordError('Password is required.');
    } else if (!validatePassword(password)) {
        setPasswordError('Password must be at least 8 characters.');
    } else {
        setPasswordError('');
    }
};

export const handleSignUp = (firstName, lastName, email, password,setFirstNameError, setLastNameError, setEmailError, setPasswordError) => {
    let isValid = true;

    if (firstName === '') {
        setFirstNameError('First Name is required.');
        isValid = false;
    }
    if (lastName === '') {
        setLastNameError('Last Name is required.');
        isValid = false;
    }
    if (email === '') {
        setEmailError('Email is required.');
        isValid = false;
    } else if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address.');
        isValid = false;
    }

    if (password === '') {
        setPasswordError('Password is required.');
        isValid = false;
    } else if (!validatePassword(password)) {
        setPasswordError('Password must be at least 8 characters.');
        isValid = false;
    }

    return isValid;
};
