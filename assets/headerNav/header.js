window.addEventListener('scroll', () => {
  const header = document.querySelector('.headerContainer');
  if (header) {
    if (window.scrollY > 120) {
      header.classList.add('sticky');
    } else {
      header.classList.remove('sticky');
      header.style.transition = 'all 0.5s ease-in-out';
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.headerContainer');
  if (header) {
    const listItems = header.querySelectorAll('li');
  }
});
