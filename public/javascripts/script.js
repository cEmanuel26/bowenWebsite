const openSigns = document.querySelectorAll('.intrebare span .arrow-down');
const closeSigns = document.querySelectorAll('.intrebare span .arrow-up');
const paragraphFaq = document.querySelectorAll('.intrebare p');

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
