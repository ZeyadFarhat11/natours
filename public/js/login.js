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
