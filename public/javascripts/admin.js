document.addEventListener('DOMContentLoaded', () => {
  const hourHeader = document.querySelector('.sortHour');
  const nameHeader = document.querySelector('.sortName');
  const dateHeader = document.querySelector('.sortDate');
  const table = document.querySelector('.adminTable');
  const tbody = table.querySelector('tbody'); // Access tbody directly

  let rows = Array.from(tbody.rows); // Get all rows from the tbody

  let isAscendingHour = true;
  let isAscendingName = true;
  let isAscendingDate = true;

  // Sorting function for Hour column
  hourHeader.addEventListener('click', () => {
    const sortedRows = rows.sort((a, b) => {
      const hourA = a.cells[4].textContent.trim();
      const hourB = b.cells[4].textContent.trim();

      const [hourAValue, minuteA] = hourA.split(':').map(Number);
      const [hourBValue, minuteB] = hourB.split(':').map(Number);

      const comparison = hourAValue - hourBValue || minuteA - minuteB;
      return isAscendingHour ? comparison : -comparison;
    });

    // Clear the tbody and append the sorted rows
    tbody.innerHTML = ''; // Clear all tbody rows
    sortedRows.forEach((row) => tbody.appendChild(row)); // Append sorted rows
    isAscendingHour = !isAscendingHour;
  });

  // Sorting function for Name column
  nameHeader.addEventListener('click', () => {
    const sortedRows = rows.sort((a, b) => {
      const nameA = a.cells[2].textContent.trim().toLowerCase();
      const nameB = b.cells[2].textContent.trim().toLowerCase();
      return isAscendingName
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    // Clear the tbody and append the sorted rows
    tbody.innerHTML = ''; // Clear all tbody rows
    sortedRows.forEach((row) => tbody.appendChild(row)); // Append sorted rows
    isAscendingName = !isAscendingName;
  });

  // Sorting function for Date column
  dateHeader.addEventListener('click', () => {
    const sortedRows = rows.sort((a, b) => {
      const dateA = new Date(a.cells[3].textContent.trim());
      const dateB = new Date(b.cells[3].textContent.trim());
      return isAscendingDate ? dateA - dateB : dateB - dateA;
    });

    // Clear the tbody and append the sorted rows
    tbody.innerHTML = ''; // Clear all tbody rows
    sortedRows.forEach((row) => tbody.appendChild(row)); // Append sorted rows
    isAscendingDate = !isAscendingDate;
  });
});

// Search function for filtering table rows
function searchTable(field) {
  const searchInput = document.getElementById(
    `searchBy${capitalizeFirstLetter(field)}`
  );
  const searchTerm = searchInput.value.trim().toLowerCase();

  const tbody = document.querySelector('tbody');
  const currentRows = Array.from(tbody.rows);

  currentRows.forEach((row) => {
    let cellText = '';

    // Select the corresponding column based on the field
    switch (field) {
      case 'name':
        // Check both first and last name columns (index 1 for firstname and index 2 for lastname)
        const firstName = row.cells[1].textContent.trim().toLowerCase();
        const lastName = row.cells[2].textContent.trim().toLowerCase();
        cellText = firstName + ' ' + lastName;
        break;
      case 'date':
        cellText = row.cells[3].textContent.trim().toLowerCase(); // Column 3 is the date
        break;
      case 'hour':
        // Ensure the hour is in a consistent format (e.g., '09:00')
        const hour = row.cells[4].textContent.trim().toLowerCase();
        cellText = hour.padStart(5, '0'); // Ensures format like '09:00'
        break;
      default:
        cellText = '';
    }

    if (cellText.includes(searchTerm)) {
      row.style.display = ''; // Show row
    } else {
      row.style.display = 'none'; // Hide row
    }
  });
}

// Helper function to capitalize the first letter of the field
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (target.matches('.deleteButton')) {
    const appointmentId = target.getAttribute('data-id');
    deleteAppointment(appointmentId);
  }
});

function deleteAppointment(appointmentId) {
  if (confirm('Are you sure you want to delete this appointment?')) {
    fetch(`/appointments/delete/${appointmentId}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete appointment'); // Handle non-200 responses
        }
        return response.json(); // Try parsing the response as JSON
      })
      .then((data) => {
        alert(data.message); // Show success message
        location.reload(); // Reload the page to reflect changes
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Failed to delete appointment. Please try again.');
      });
  }
}

document.querySelectorAll('.editButton').forEach((button) => {
  button.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    const cells = row.cells;

    document.getElementById('editId').value = cells[0].textContent.trim();
    document.getElementById('editFirstname').value =
      cells[1].textContent.trim();
    document.getElementById('editLastname').value = cells[2].textContent.trim();
    document.getElementById('editDate').value = formatDateForInput(
      cells[3].textContent.trim()
    );
    document.getElementById('editTime').value = cells[4].textContent.trim();
    document.getElementById('editMessage').value = cells[5].textContent.trim();
    document.getElementById('editEmail').value = cells[6].textContent.trim();
    document.getElementById('editPhone').value = cells[7].textContent.trim();
    document.getElementById('editDetails').value = cells[8].textContent.trim();
    document.getElementById('editMove').value = cells[9].textContent.trim();
    document.getElementById('editAddress').value = cells[10].textContent.trim();

    document.getElementById('editModal').style.display = 'block';
  });
});

function formatDateForInput(dateStr) {
  if (!dateStr) {
    console.error('Invalid date string:', dateStr);
    return '';
  }

  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) {
    console.error('Date string format is incorrect:', dateStr);
    return '';
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

document.getElementById('editForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const appointmentId = document.getElementById('editId').value;

  const updatedAppointment = {
    firstname: document.getElementById('editFirstname').value,
    lastname: document.getElementById('editLastname').value,
    selectedDate: document.getElementById('editDate').value,
    selectedTime: document.getElementById('editTime').value,
    message: document.getElementById('editMessage').value,
    email: document.getElementById('editEmail').value,
    phone: document.getElementById('editPhone').value,
    details: document.getElementById('editDetails').value,
    move: document.getElementById('editMove').value,
    address: document.getElementById('editAddress').value,
  };

  fetch(`/appointments/${appointmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedAppointment),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message);
      location.reload();
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Failed to update appointment.');
    });
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('editModal').style.display = 'none';
});
