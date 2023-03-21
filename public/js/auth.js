import showAlert from './alert';

export const login = async (e) => {
  e.preventDefault();
  const body = {
    email: e.target.email.value,
    password: e.target.password.value,
  };
  const res = await fetch('/api/v1/users/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.status === 'success') {
    setTimeout(() => {
      location.assign('/');
    }, 1000);

    showAlert('success', 'Logged in successfully.');
  } else {
    showAlert('error', data?.error?.message || data?.message || 'Error logging in! Try again.');
  }
};

export const logout = async (e) => {
  try {
    await fetch('/api/v1/users/logout');
    location.assign('/');
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};

export const signup = async (e) => {
  e.preventDefault();

  try {
    validateInputs(e.target, 'signup');
  } catch (err) {
    return showAlert('error', err.message);
  }

  const body = {
    name: e.target.name.value,
    email: e.target.email.value,
    password: e.target.password.value,
  };

  const res = await fetch('/api/v1/users/signup', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (data?.status === 'success') {
    window.location.assign('/');
  } else {
    return showAlert('error', 'Something went wrong! Please try again.');
  }
};

function validateInputs(form, page) {
  if (page === 'signup') {
    if (form.password.value !== form.passwordConfirm.value)
      throw new Error('Password confirm must look like password-confirm!');
  }
}
