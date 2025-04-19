const openSigns = document.querySelectorAll('.intrebare span .arrow-down');
const closeSigns = document.querySelectorAll('.intrebare span .arrow-up');
const paragraphFaq = document.querySelectorAll('.intrebare p');
const appointment = document.querySelector('.btnProgramare');
const appointmentTherapeut = document.querySelector('.btnTerapeutProgramare');
const findMore = document.querySelector('.btnDescopera');
const aboutBowen = document.querySelector('.aboutBowen');
const benefits = document.querySelector('.btnBeneficii');
function hideParagraphs() {
  paragraphFaq.forEach((paragraph) => {
    paragraph.style.display = 'none';
    paragraph.style.opacity = 0;
    paragraph.style.transition = 'opacity 0.5s ease-in-out';
  });
}
function showParagraphs() {
  paragraphFaq.forEach((paragraph) => {
    paragraph.style.display = 'block';
    setTimeout(() => {
      paragraph.style.opacity = 1;
    }, 10); // Small delay to ensure the transition occurs
  });
}

function hideCloseSign(index) {
  closeSigns[index].style.display = 'none';
}

function showCloseSign(index) {
  closeSigns[index].style.display = 'inline';
}

function hideOpenSign(index) {
  openSigns[index].style.display = 'none';
}

function showOpenSign(index) {
  openSigns[index].style.display = 'inline';
}

// Initial state: hide all paragraphs and show only the + signs
hideParagraphs();
openSigns.forEach((openSign, index) => {
  openSign.style.display = 'inline';
});
closeSigns.forEach((closeSign) => {
  closeSign.style.display = 'none';
});

openSigns.forEach((plusSign, index) => {
  plusSign.addEventListener('click', function () {
    const correspondingParagraph = paragraphFaq[index];
    if (
      correspondingParagraph.style.display === 'none' ||
      correspondingParagraph.style.display === ''
    ) {
      correspondingParagraph.style.display = 'block';
      setTimeout(() => {
        correspondingParagraph.style.opacity = 1;
      }, 10); // Small delay to ensure the transition occurs
      showCloseSign(index);
      hideOpenSign(index);
    }
  });
});

closeSigns.forEach((closeSign, index) => {
  closeSign.addEventListener('click', function () {
    const correspondingParagraph = paragraphFaq[index];
    correspondingParagraph.style.opacity = 0;
    correspondingParagraph.addEventListener(
      'transitionend',
      function onTransitionEnd() {
        correspondingParagraph.style.display = 'none';
        correspondingParagraph.removeEventListener(
          'transitionend',
          onTransitionEnd
        );
      }
    );
    hideCloseSign(index);
    showOpenSign(index);
  });
});

appointment.onclick = () => (window.location.href = '/appointments');
appointmentTherapeut.onclick = () => (window.location.href = '/appointments');

findMore.onclick = () => (window.location.href = '/benefits');
aboutBowen.onclick = () => (window.location.href = '/about');
benefits.onclick = () => (window.location.href = '/benefits');

document.addEventListener('DOMContentLoaded', function () {
  const track = document.querySelector('.carousel-track');
  const container = document.querySelector('.carousel-container');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // Only set up the carousel if it exists
  if (!track) return;

  // Calculate the width of all reviews combined
  const reviewCards = document.querySelectorAll('.review-card');
  const reviewWidth =
    reviewCards.length > 0 ? reviewCards[0].offsetWidth + 30 : 0; // width + margin

  // Manual navigation
  nextBtn.addEventListener('click', () => {
    // Pause the animation
    track.style.animation = 'none';

    // Calculate current position
    const computedStyle = window.getComputedStyle(track);
    const currentTransform = new DOMMatrix(computedStyle.transform);
    const currentX = currentTransform.m41;

    // Move to next card
    const newPosition = currentX - reviewWidth;
    track.style.transform = `translateX(${newPosition}px)`;

    // Check if we need to reset
    setTimeout(() => {
      const trackWidth = track.offsetWidth;
      if (Math.abs(newPosition) > trackWidth / 2) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';

        // Force reflow
        void track.offsetWidth;

        // Restore transition
        track.style.transition = 'transform 0.5s ease';
      }
    }, 500);
  });

  prevBtn.addEventListener('click', () => {
    // Pause the animation
    track.style.animation = 'none';

    // Calculate current position
    const computedStyle = window.getComputedStyle(track);
    const currentTransform = new DOMMatrix(computedStyle.transform);
    const currentX = currentTransform.m41;

    // Move to previous card
    const newPosition = currentX + reviewWidth;
    track.style.transform = `translateX(${newPosition}px)`;

    // Check if we need to reset
    setTimeout(() => {
      if (newPosition > 0) {
        track.style.transition = 'none';
        const trackWidth = track.offsetWidth;
        track.style.transform = `translateX(${
          -trackWidth / 2 + reviewWidth
        }px)`;

        // Force reflow
        void track.offsetWidth;

        // Restore transition
        track.style.transition = 'transform 0.5s ease';
      }
    }, 500);
  });

  // Function to check if we need to reset the position
  function checkPosition() {
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // If we've scrolled more than half the track width
    if (Math.abs(trackRect.x - containerRect.x) > trackRect.width / 2) {
      // Reset position without animation
      track.style.animation = 'none';
      track.style.transform = 'translateX(0)';

      // Force reflow
      void track.offsetWidth;

      // Restart animation
      track.style.animation = 'scroll 40s linear infinite';
    }
  }

  // Check position every 5 seconds
  setInterval(checkPosition, 5000);

  // Pause animation on hover
  container.addEventListener('mouseenter', function () {
    track.style.animationPlayState = 'paused';
  });

  container.addEventListener('mouseleave', function () {
    track.style.animationPlayState = 'running';
  });

  // Touch events for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      track.style.animationPlayState = 'paused';
    },
    { passive: true }
  );

  track.addEventListener(
    'touchend',
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      track.style.animationPlayState = 'running';
    },
    { passive: true }
  );

  function handleSwipe() {
    const difference = touchStartX - touchEndX;
    if (difference > 50) {
      // Swipe left (next)
      nextBtn.click();
    } else if (difference < -50) {
      // Swipe right (prev)
      prevBtn.click();
    }
  }
});
