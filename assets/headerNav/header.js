window.addEventListener('scroll', () => {
  const header = document.querySelector('.headerContainer');

  if (window.scrollY > 120) {
    header.classList.add('sticky');
  } else {
    header.classList.remove('sticky');
    header.style.transition = 'all 0.5s ease-in-out';
  }
});
