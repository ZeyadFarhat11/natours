import { updateUserData, updateUserPassword, handleUserPhotoChange } from './account';
import { login, logout } from './login';
import bookTour from './stripe';

const logoutBtn = document.querySelector('button.nav__el.nav__el--logout');
const loginForm = document.querySelector('.login-form .form');
const accountUserForm = document.querySelector(
  '.user-view .user-view__form-container .form-user-data'
);
const accountUserPasswordForm = document.querySelector(
  '.user-view .user-view__form-container .form-user-settings'
);
const chooseNewPhotoBtn = document.querySelector('.user-view__content .form label.btn-text');
const bookTourBtn = document.querySelector('.section-cta button#book-tour');

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (loginForm) {
  loginForm.addEventListener('submit', login);
}

if (accountUserForm) {
  accountUserForm.addEventListener('submit', updateUserData);
}

if (accountUserPasswordForm) {
  accountUserPasswordForm.addEventListener('submit', updateUserPassword);
}

if (chooseNewPhotoBtn) {
  const input = chooseNewPhotoBtn.parentElement.querySelector('input[type="file"]');
  input.addEventListener('change', handleUserPhotoChange);
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', bookTour);
}
