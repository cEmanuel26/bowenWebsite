document.addEventListener('DOMContentLoaded', function () {
  var calendarEl = document.getElementById('calendar');
  var calendar;

  let fullyBookedSlots = [];

  const fetchFullyBookedSlots = async () => {
    const response = await fetch('/fully-booked');
    const data = await response.json();
    return data; // Expected format: [{ date: '2025-04-11', time: '09:00' }]
  };

  const blockFullyBookedSlots = async () => {
    const response = await fetch('/fully-booked');
    const data = await response.json();
    fullyBookedSlots = data;

    const backgroundEvents = data.map((slot) => {
      const startDateTime = `${slot.date}T${slot.time}`;
      const endDate = new Date(startDateTime);
      endDate.setMinutes(endDate.getMinutes() + 30); // assuming 30 min slot

      return {
        start: startDateTime,
        end: endDate.toISOString(),
        display: 'background',
        color: '#ff4d4d',
        overlap: false,
      };
    });

    calendar.addEventSource(backgroundEvents);
  };

  const isSlotFullyBooked = async (date, time) => {
    const bookingsCount = await fetch(
      `/check-booking?date=${date}&time=${time}`
    );
    const data = await bookingsCount.json();
    return data.count >= 3;
  };

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    locale: 'ro',
    selectable: true,
    selectHelper: true,
    allDaySlot: false, // ✅ remove "all-day" row
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    slotDuration: '00:30:00',
    slotLabelInterval: '00:30:00',
    slotMinTime: '09:00:00',
    slotMaxTime: '19:00:00',
    firstDay: new Date().getDay(),
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay',
    },

    dayCellDidMount: function (info) {
      // ✅ color Sunday column header
      if (info.date.getDay() === 0) {
        info.el.style.backgroundColor = '#f77878';
      }
    },

    slotLaneDidMount: function (info) {
      const cellDate = info.date;
      const dateStr = cellDate.toISOString().split('T')[0];
      const timeStr = cellDate.toTimeString().slice(0, 5);

      // ✅ make Sunday time slots red
      if (cellDate.getDay() === 0) {
        info.el.style.backgroundColor = '#f77878';
        info.el.style.pointerEvents = 'none';
      }

      // ✅ block fully booked slots
      for (let slot of fullyBookedSlots) {
        if (slot.date === dateStr && slot.time === timeStr) {
          info.el.style.backgroundColor = '#ff4d4d';
          info.el.style.pointerEvents = 'none';
        }
      }
    },

    select: async function (info) {
      var today = new Date();
      if (info.start < today.setHours(0, 0, 0, 0)) {
        calendar.unselect();
        return;
      }

      let selectedDateStr = info.start.toISOString().split('T')[0];
      let selectedTimeStr = info.start.toTimeString().slice(0, 5);

      const isBooked = await isSlotFullyBooked(
        selectedDateStr,
        selectedTimeStr
      );
      if (isBooked) {
        calendar.unselect();
        return;
      }
    },

    dateClick: async function (info) {
      var today = new Date();
      if (info.date < today.setHours(0, 0, 0, 0)) return;
      if (info.date.getDay() === 0) return;

      let clickedDate = info.date;
      let clickedDateStr = clickedDate.toISOString().split('T')[0];
      let clickedTimeStr = clickedDate.toTimeString().slice(0, 5);

      const isBooked = await isSlotFullyBooked(clickedDateStr, clickedTimeStr);
      if (isBooked) {
        const notification = document.createElement('div');
        notification.innerText = 'Acesta ora nu este disponibila!';
        notification.style.position = 'fixed';
        notification.style.bottom = '550px';
        notification.style.right = '380px';
        notification.style.backgroundColor = '#ff4d4d';
        notification.style.color = '#fff';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '1000';

        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 3000);
        return;
      }

      var modal = document.getElementById('myModal');
      var modalTitle = document.getElementById('modalTitle');
      var modalDate = document.getElementById('modalDate');

      modalTitle.innerText = 'Programare nouă';
      var options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      };
      modalDate.innerText =
        'Ați selectat data: ' +
        new Date(clickedDate)
          .toLocaleString('ro-RO', options)
          .replace(/(\d{2}:\d{2})/, 'ora $1');

      document.getElementById('selectedDate').value = clickedDateStr;
      document.getElementById('selectedTime').value = clickedTimeStr;

      modal.classList.add('myModal');
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
    },
  });

  calendar.render();
  blockFullyBookedSlots();

  var travelYes = document.getElementById('travelYes');
  var address = document.getElementsByClassName('address')[0];
  travelYes.addEventListener('change', function () {
    address.style.display = travelYes.checked ? 'block' : 'none';
  });
  address.style.display = 'none';

  var travelNo = document.getElementById('travelNo');
  travelNo.addEventListener('change', function () {
    if (travelNo.checked) {
      address.style.display = 'none';
      var addressInput = address.querySelector('input');
      if (addressInput) {
        addressInput.value = 'fara deplasare';
      }
    }
  });
});
