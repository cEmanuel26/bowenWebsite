document
  .getElementById('forgotPasswordForm')
  .addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    try {
      const response = await fetch('/forgotPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      if (!response.ok) {
        showMessage(
          'Error sending reset link: ' + response.statusText,
          'error'
        );
        return;
      }

      const result = await response.json();
      if (result.success) {
        showMessage('Password reset link sent to your email!', 'success');
      } else {
        showMessage(
          'Error sending reset link: ' + (result.message || 'Unknown error'),
          'error'
        );
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('Something went wrong.', 'error');
    }
  });

// Function to display messages in a user-friendly way
function showMessage(message, type) {
  const messageContainer = document.getElementById('messageContainer');
  messageContainer.style.textAlign = 'center';
  messageContainer.style.marginTop = '20px';
  messageContainer.style.display = 'block';
  messageContainer.textContent = message;

  if (type === 'success') {
    messageContainer.style.backgroundColor = '#4CAF50'; // Green for success
    messageContainer.style.color = 'white';
  } else {
    messageContainer.style.backgroundColor = '#f44336'; // Red for error
    messageContainer.style.color = 'white';
  }
}
