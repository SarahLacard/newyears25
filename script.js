document.addEventListener('DOMContentLoaded', () => {
    const helpTrigger = document.querySelector('.help-trigger');
    const modal = document.getElementById('helpModal');
    const closeSpan = document.querySelector('.close');
    const input = document.querySelector('.input-line');

    // Help trigger functionality
    helpTrigger.addEventListener('click', () => {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
    });

    // Close button functionality
    closeSpan.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal if user clicks outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle input submission
    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            console.log('Input submitted:', input.value);
            // Add your input handling logic here
            input.value = '';  // Clear input after submission
        }
    });
});
  