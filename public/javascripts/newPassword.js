document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('resetPasswordForm'); // Form element
  const token = new URLSearchParams(window.location.search).get('token'); // Get token from the URL

  // Check if token exists in the URL
  if (!token) {
    alert('Invalid token');
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent the form from submitting immediately

    const newPassword = document.getElementById('newPassword').value; // New password input value
    const confirmPassword = document.getElementById('confirmPassword').value; // Confirm password input value

    // Validate password match
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return; // Stop form submission if passwords don't match
    }

    // Check if the new password is empty
    if (!newPassword) {
      alert('Please enter a new password.');
      return;
    }

    // Prepare the data to send
    const data = {
      token: token,
      newPassword: newPassword,
    };

    try {
      // Send the reset password request to the server
      const response = await fetch('/newPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // If password reset is successful

        window.location.href = '/login?reset=success';
      } else {
        // If there was an error
        alert(result.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    }
  });
});
