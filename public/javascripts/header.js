const dropDown = document.getElementById('profileDropdown');
const profileImg = document.getElementById('profileImg'); // Target the image

const openBtn = document.getElementById('openUploadModal');
// Initially hide the modal

if (openBtn) {
  openBtn.addEventListener('click', function (e) {
    e.preventDefault();

    const modal = document.getElementById('uploadModal');
    const closeBtn = document.getElementById('closeUploadModal');

    // Make modal full screen with grey background
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.transform = 'translateX(0)'; // Ensure it's centered horizontally

    // Close button
    closeBtn.addEventListener('click', function () {
      modal.style.display = 'none';
    });

    // Close modal when clicking on the grey background
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}
if (profileImg && dropDown) {
  profileImg.addEventListener('click', function (e) {
    e.stopPropagation();
    dropDown.classList.toggle('visible');

    window.addEventListener('click', (e) => {
      if (!profileImg.contains(e.target) && !dropDown.contains(e.target)) {
        dropDown.classList.remove('visible');
      }
    });
  });
}

// Remove log out button if user is not logged in
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
document
  .getElementById('uploadModal')
  .querySelector('form')
  .addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this); // "this" refers to the <form> element

    fetch('/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json()) // Parse the response as JSON
      .then((data) => {
        if (data.success) {
          const profileImg = document.getElementById('profileImg');
          // Add a timestamp to prevent caching
          profileImg.src = data.imageUrl + '?t=' + new Date().getTime();

          // Optionally, close the modal after a successful upload
          document.getElementById('closeUploadModal').click();
        } else {
          alert('Error uploading profile picture');
        }
      })
      .catch((error) => {
        console.error('Error uploading profile picture:', error);
        alert('There was an error uploading your profile picture.');
      });
  });
// Sticky header on scroll
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
