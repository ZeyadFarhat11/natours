import showAlert from './alert';

export default async function bookTour(e) {
  e.target.innerText = 'PROCESSING...';
  setTimeout(() => (e.target.innerText = 'Book tour now!'), 5000);

  const data = await (
    await fetch(`/api/v1/bookings/checkout-session/${e.target.dataset.tour}`)
  ).json();
  const url = data.data?.session?.url;

  if (url) {
    window.location.href = url;
  } else {
    showAlert('error', data.message || 'Something went wrong! Please try again later.');
  }
}
