document.addEventListener('DOMContentLoaded', () => {
  const hourHeader = document.querySelector('.hour');
  const nameHeader = document.querySelector('.name');
  const dateHeader = document.querySelector('.date');
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
    hourHeader.textContent = isAscendingHour ? 'Ora ↑' : 'Ora ↓';
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
    nameHeader.textContent = isAscendingName ? 'Nume ↑' : 'Nume ↓';
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
    dateHeader.textContent = isAscendingDate ? 'Data ↑' : 'Data ↓';
  });
});
