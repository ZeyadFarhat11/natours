import showAlert from './alert';

export default async function bookTour(e) {
  e.target.innerText = 'PROCESSING...';

  const data = await (
    await fetch(`/api/v1/bookings/checkout-session/${e.target.dataset.tour}`)
  ).json();
  const url = data.data?.session?.url;

  if (url) {
    window.location.href = url;
  } else {
    showAlert('error', 'Something went wrong! Please try again later.');
  }
}
