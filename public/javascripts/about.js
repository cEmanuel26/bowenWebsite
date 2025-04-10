const certifications = document.querySelectorAll('.certifications img');
certifications.forEach((certification) => {
  certification.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';

    const modalImg = document.createElement('img');
    modalImg.src = certification.src;
    modalImg.style.maxWidth = '90%';
    modalImg.style.maxHeight = '90%';
    modalImg.style.boxShadow = '0 0 10px #fff';

    modal.appendChild(modalImg);
    document.body.appendChild(modal);

    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  });

  certification.addEventListener('mouseover', () => {
    certification.style.transform = 'scale(1.2)';
    certification.style.transition = 'transform 0.3s ease';
  });

  certification.addEventListener('mouseout', () => {
    certification.style.transform = 'scale(1)';
  });
});
