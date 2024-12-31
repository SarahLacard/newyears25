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
    const settingsModal = document.getElementById('settingsModal');
    const settingsClose = document.querySelector('.settings-close');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveConfirmation = document.getElementById('save-confirmation');
    
    let selectedModel = null;
    let startTime;
    let timerInterval;

    // Initialize modal manager
    const modalManager = new ModalManager();
    modalManager.init({
        privacyNotice,
        helpModal: modal,
        settingsModal
    });

    // Help trigger functionality
    helpTrigger.addEventListener('click', () => {
        modalManager.open('help');
    });

    // Close button functionality
    closeSpan.addEventListener('click', () => {
        modalManager.close('help');
    });

    // Close modal if user clicks outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modalManager.close('help');
        }
        if (event.target === settingsModal) {
            modalManager.close('settings');
        }
    });

    // Load existing API key if any
    const savedApiKey = localStorage.getItem('openaiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Settings trigger functionality
    const settingsTrigger = document.createElement('div');
    settingsTrigger.className = 'help-trigger settings-trigger';
    settingsTrigger.textContent = 'S';
    document.body.appendChild(settingsTrigger);

    settingsTrigger.addEventListener('click', () => {
        modalManager.open('settings');
    });

    // Close settings modal
    settingsClose.addEventListener('click', () => {
        modalManager.close('settings');
    });

    // Save API key on paste
    apiKeyInput.addEventListener('paste', (event) => {
        setTimeout(() => {
            const pastedValue = apiKeyInput.value.trim();
            if (pastedValue) {
                localStorage.setItem('openaiApiKey', pastedValue);
                saveConfirmation.classList.add('show');
                setTimeout(() => {
                    saveConfirmation.classList.remove('show');
                }, 2000);
            }
        }, 50);
    });

    // Hide privacy notice when typing starts
    initialInput.addEventListener('input', (event) => {
        if (event.target.value.length === 1) {
            modalManager.hidePrivacyNotice();
        }
    });

    // Click to dismiss privacy notice
    privacyNotice.addEventListener('click', () => {
        modalManager.hidePrivacyNotice();
    });

    // ... rest of the existing code ...
});
  