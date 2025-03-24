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
  // const listItems = header.querySelectorAll('li');
});

const programare = document.querySelector('.programare h4');
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.headerContainer');
  // const listItems = header.querySelectorAll('li');

  const programare = document.querySelector('.programare h4');
  if (programare && logoutButton) {
    if (!programare.textContent.trim()) {
      logoutButton.remove();
    }
  }

  const programareLink = document.querySelector('.programare a');
  if (logoutButton && programareLink) {
    programareLink.remove();
  } else if (!logoutButton && programareLink) {
    programareLink.style.display = 'block';
  }
});
