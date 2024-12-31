document.addEventListener('DOMContentLoaded', () => {
    const helpTrigger = document.querySelector('.help-trigger');
    const modal = document.getElementById('helpModal');
    const closeSpan = document.querySelector('.close');
    const initialInput = document.querySelector('.initial-input-container input');
    const bottomInput = document.querySelector('.bottom-input-container input');
    const initialInputContainer = document.querySelector('.initial-input-container');
    const bottomInputContainer = document.querySelector('.bottom-input-container');
    const messagesContainer = document.querySelector('.messages-container');
    const optionsContainer = document.querySelector('.options-container');
    const optionBoxes = document.querySelectorAll('.option-box');
    const privacyNotice = document.getElementById('privacyNotice');
    const countdownEl = document.getElementById('countdown');
    const tokenCounter = document.querySelector('.token-counter');
    
    let countdown = 15;
    let timer = null;

    // Privacy notice handling
    function showPrivacyNotice() {
        privacyNotice.classList.add('show');
        startCountdown();
    }

    function hidePrivacyNotice() {
        privacyNotice.classList.remove('show');
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function startCountdown() {
        if (timer) clearInterval(timer);
        
        timer = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                hidePrivacyNotice();
            }
        }, 1000);
    }

    // Show privacy notice on load
    showPrivacyNotice();

    // Click anywhere on notice to dismiss
    privacyNotice.addEventListener('click', hidePrivacyNotice);

    // Help trigger functionality
    helpTrigger.addEventListener('click', () => {
        modal.style.display = 'flex';
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

    function addMessage(text, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'response-message'}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
    }

    function showOptions() {
        optionsContainer.style.display = 'flex';
        setTimeout(() => {
            optionsContainer.classList.add('visible');
            optionBoxes.forEach(box => box.classList.add('visible'));
        }, 300);
    }

    // Handle initial input submission
    initialInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && initialInput.value.trim()) {
            const messageText = initialInput.value;
            initialInput.value = '';
            initialInput.disabled = true;

            // Add message immediately
            addMessage(messageText, true);
            
            // Start fade out of input
            initialInputContainer.classList.add('moved');
            
            // Show options after input fades
            setTimeout(showOptions, 300);
        }
    });

    // Handle option selection
    optionBoxes.forEach(box => {
        box.addEventListener('click', () => {
            // Hide options immediately
            optionsContainer.style.display = 'none';
            initialInputContainer.classList.add('hidden');
            
            // Add response message and show bottom input
            addMessage(box.textContent, false);
            bottomInputContainer.classList.add('visible');
            
            // Show token counter
            tokenCounter.classList.add('visible');
        });
    });

    // Handle bottom input submission
    bottomInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && bottomInput.value.trim()) {
            const messageText = bottomInput.value;
            addMessage(messageText, true);
            bottomInput.value = '';
        }
    });
});
  