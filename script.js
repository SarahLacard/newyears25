document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openModal');
    const modal = document.getElementById('myModal');
    const closeSpan = document.querySelector('.close');
  
    openModalBtn.addEventListener('click', () => {
      modal.style.display = 'block';
    });
  
    closeSpan.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  
    // Close modal if user clicks outside the modal content
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  