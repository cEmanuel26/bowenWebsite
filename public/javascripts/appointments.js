document.addEventListener('DOMContentLoaded', (event) => {
  // Get the modal
  const modal = document.getElementById('myModal');

  // Get the button that opens the modal
  const btn = document.getElementById('register');

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName('close')[0];
  const registerBtn = document.getElementById('registerSend');
  if (!registerBtn) {
    console.error('Register button not found');
    return;
  }
  console.log(registerBtn);

  // When the user clicks on the button, open the modal
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
  });

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = 'none';
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
  const params = new URLSearchParams(window.location.search);
  if (params.get('reset') === 'success') {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
      successMessage.style.display = 'block';
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 10000); // 10 seconds
    }
  }

  // Check if register passwords match
  function checkPasswordsMatch() {
    const passwordErrorMessages =
      document.getElementsByClassName('passwordError');
    for (let i = 0; i < passwordErrorMessages.length; i++) {
      passwordErrorMessages[i].style.display = 'none';
    }
  }

  checkPasswordsMatch();

  // Add your event here
  registerBtn.addEventListener('click', (e) => {
    const password = document.getElementById('regpassword');
    const confirmPassword = document.getElementById('confirmpassword');
    const passwordErrorMessages =
      document.getElementsByClassName('passwordError');
    console.log(password, confirmPassword);

    if (password.value !== confirmPassword.value) {
      e.preventDefault();
      for (let i = 0; i < passwordErrorMessages.length; i++) {
        passwordErrorMessages[i].style.display = 'block';
        passwordErrorMessages[i].style.position = 'relative';
        passwordErrorMessages[i].style.animation = 'none'; // Reset animation
        passwordErrorMessages[i].offsetHeight; // Trigger reflow
        passwordErrorMessages[i].style.animation =
          'moveLeftRight 1s ease-in-out';
      }
    }
  });
});
