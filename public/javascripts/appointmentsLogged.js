document.addEventListener('DOMContentLoaded', function () {
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    locale: 'ro', // Set the locale to Romanian
    selectable: true,
    selectHelper: true,
    slotLabelFormat: {
      hour: 'numeric',
      minute: '2-digit',
      omitZeroMinute: false,
      meridiem: false,
    },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay',
    },
    select: function (info) {
      var today = new Date();
      if (info.start < today.setHours(0, 0, 0, 0)) {
        calendar.unselect(); // Unselect the date
      }
    },
    dayCellDidMount: function (info) {
      var today = new Date();
      if (info.date < today.setHours(0, 0, 0, 0)) {
        info.el.style.backgroundColor = '#f77878'; // Set the background color to red
        info.el.style.pointerEvents = 'none'; // Make the cell unclickable
      } else if (info.date.getDay() === 0) {
        info.el.style.backgroundColor = '#f77878'; // Set the background color to red
        info.el.style.pointerEvents = 'none'; // Make the cell unclickable
      }
    },
    views: {
      timeGridWeek: {
        allDaySlot: false, // Remove the all-day table row
        slotMinTime: '09:00:00', // Start time 9 AM
        slotMaxTime: '19:00:00', // End time 6 PM
      },
      timeGridDay: {
        allDaySlot: false, // Remove the all-day table row
        slotMinTime: '09:00:00', // Start time 9 AM
        slotMaxTime: '19:00:00', // End time 6 PM
      },
    },
    firstDay: new Date().getDay(), // Set the first day of the week to the current day
    dateClick: function (info) {
      var today = new Date();
      if (info.date < today.setHours(0, 0, 0, 0)) {
        return; // Disable clicking on past dates
      } else if (info.date.getDay() === 0) {
        return; // Disable clicking on Sundays
      } else {
        var modal = document.getElementById('myModal');
        var modalTitle = document.getElementById('modalTitle');
        var modalDate = document.getElementById('modalDate');

        modalTitle.innerText = 'Programare noua';
        var options = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        };
        modalDate.innerText =
          'Ați selectat data: ' +
          new Date(info.date)
            .toLocaleString('ro-RO', options)
            .replace(/(\d{2}:\d{2})/, 'ora $1');
        modal.classList.add('myModal');

        // Set selected date and time to hidden inputs
        var selectedDate = info.date;
        document.getElementById('selectedDate').value = selectedDate
          .toISOString()
          .split('T')[0]; // YYYY-MM-DD

        var localTime = new Date(
          selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
        );
        var selectedTime = localTime.toISOString().split('T')[1]; // HH:MM:SS
        document.getElementById('selectedTime').value = selectedTime;

        modal.style.display = 'block';

        var closeButton = document.getElementsByClassName('close')[0];
        closeButton.onclick = function () {
          modal.style.display = 'none';
        };

        window.onclick = function (event) {
          if (event.target == modal) {
            modal.style.display = 'none';
          }
        };
      }
    },
  });
  calendar.render();
  var travelYes = document.getElementById('travelYes');
  var address = document.getElementsByClassName('address')[0]; // Assuming there's only one address div
  travelYes.addEventListener('change', function () {
    if (travelYes.checked) {
      address.style.display = 'block'; // Show the address div
    } else {
      address.style.display = 'none'; // Hide the address div
    }
  });

  // Initially hide the address div
  address.style.display = 'none';

  var travelNo = document.getElementById('travelNo');
  travelNo.addEventListener('change', function () {
    if (travelNo.checked) {
      address.style.display = 'none'; // Hide the address div
      var addressInput = address.querySelector('input'); // Assuming there's an input inside the address div
      if (addressInput) {
        addressInput.value = 'fara deplasare'; // Set the implicit value
      }
    }
  });
});
