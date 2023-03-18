import showAlert from './alert';

export const updateUserData = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('name', e.target.name.value);
  formData.append('email', e.target.email.value);
  if (window.newImage) {
    formData.append('photo', window.newImage);
  }

  const res = await fetch('/api/v1/users/update-profile', {
    method: 'PATCH',
    headers: {
      Accept: '*/*',
    },
    body: formData,
  });
  const json = await res.json();

  // console.log(json);
  if (json?.status === 'success') {
    showAlert('success', 'Settings updated successfully.');
  } else {
    showAlert('error', json.message || 'An error occured! Please try again.');
  }
};

export const updateUserPassword = async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button');
  const newPasswordInput = e.target.newPassword;

  if (newPasswordInput.value !== e.target.confirmPassword.value) {
    return showAlert('error', 'New password and confirm password are not the same!');
  } else if (newPasswordInput.value.length < 8) {
    return showAlert('error', 'New password must be at least 8 characters long!');
  }

  submitBtn.innerHTML = 'Updating...';

  const body = {
    currentPassword: e.target.currentPassword.value,
    newPassword: newPasswordInput.value,
  };
  const res = await fetch('/api/v1/users/update-password', {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();

  submitBtn.innerHTML = 'Save password';

  if (json?.status === 'success') {
    showAlert('success', 'Password updated successfully.');
    e.target.reset();
  } else {
    console.log(json);
    showAlert('error', json?.message || 'An error occured! Please try again.');
  }
};

export const handleUserPhotoChange = (e) => {
  const img = e.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(img);
  const imagePreview = document.querySelector('.user-view .form__user-photo');

  reader.onload = function (e) {
    imagePreview.src = reader.result;
    window.newImage = img;
  };
};
