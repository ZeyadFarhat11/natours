export default function showAlert(status, message, callback = () => null) {
  hideAlert();
  const alert = document.createElement('div');
  alert.className = `alert alert--${status}`;
  alert.innerHTML = message;
  document.body.prepend(alert);
  setTimeout(() => {
    hideAlert();
    callback();
  }, 3000);
}

function hideAlert() {
  document.querySelector('.alert')?.remove();
}
