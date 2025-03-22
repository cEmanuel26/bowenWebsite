window.addEventListener('scroll', () => {
  const header = document.querySelector('.headerContainer');

  if (window.scrollY > 120) {
    header.classList.add('sticky');
  } else {
    header.classList.remove('sticky');
  }
});
