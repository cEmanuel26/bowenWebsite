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

//removes log out button if user is not logged in
document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.querySelector('.logoutButton');
  const loggedIn = document.querySelector('.loggedIn');

  if (loggedIn && logoutButton) {
    if (loggedIn.textContent && loggedIn.textContent.trim() !== '') {
      logoutButton.style.display = 'block';
    } else {
      logoutButton.style.display = 'none';
    }
  }
});
