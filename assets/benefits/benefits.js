const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show-left');
    } else {
      entry.target.classList.remove('show-left');
    }
  });
});
const observer2 = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log(entry);
    if (entry.isIntersecting) {
      entry.target.classList.add('show-right');
    } else {
      entry.target.classList.remove('show-right');
    }
  });
});

const elementsLeft = document.querySelectorAll('.hidden-left');
const elementsRight = document.querySelectorAll('.hidden-right');

elementsLeft.forEach((el) => observer.observe(el));
elementsRight.forEach((el) => observer2.observe(el));
