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

    // Inference status handling
    function showInferenceStatus(inMessage = false) {
        const statusEl = document.getElementById('inference-status');
        const timerEl = document.getElementById('timer');

        // Reset classes
        statusEl.classList.remove('initial', 'in-message', 'show');
        
        if (inMessage) {
            messagesContainer.appendChild(statusEl);
            statusEl.classList.add('in-message');
        } else {
            document.body.appendChild(statusEl);
            statusEl.classList.add('initial');
        }

        statusEl.style.display = 'flex';
        startTime = performance.now();

        timerInterval = setInterval(() => {
            const elapsed = performance.now() - startTime;
            timerEl.textContent = (elapsed / 1000).toFixed(1) + 's';
        }, 100);

        requestAnimationFrame(() => {
            statusEl.classList.add('show');
        });
    }

    function hideInferenceStatus() {
        const statusEl = document.getElementById('inference-status');
        clearInterval(timerInterval);
        statusEl.classList.remove('show');
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 500);
    }

    // Simplified conversation state management
    const conversationState = {
        sessionId: crypto.randomUUID(),
        startTime: new Date().toISOString(),
        messages: [],
        tokenCount: 0
    };

    // API endpoint for the worker
    const API_BASE = 'https://newyears25dataworker.sarahlacard.workers.dev';

    // Common fetch headers
    const fetchHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    // Message handling with token tracking
    async function addMessage(speaker, text, tokenUsage = 0) {
        const message = {
            speaker,
            text,
            timestamp: Date.now()
        };
        
        conversationState.messages.push(message);
        conversationState.tokenCount += tokenUsage;
        updateTokenDisplay();
        
        try {
            await fetch(`${API_BASE}/api/log`, {
                method: 'POST',
                headers: fetchHeaders,
                credentials: 'omit',
                body: JSON.stringify({
                    sessionId: conversationState.sessionId,
                    messages: conversationState.messages,
                    tokenCount: conversationState.tokenCount
                })
            });
            console.log(`Updated conversation ${conversationState.sessionId}, messages: ${conversationState.messages.length}`);
        } catch (error) {
            console.error('Error updating conversation:', error);
        }
        
        return message;
    }

    function updateTokenDisplay() {
        const formattedCount = conversationState.tokenCount.toString().padStart(6, '0');
        tokenCounter.textContent = `${formattedCount} / 1,000,000`;
    }

    function getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        const apiKey = localStorage.getItem('openaiApiKey');
        if (apiKey) {
            headers['X-OpenAI-Key'] = apiKey;
        }
        
        return headers;
    }

    async function generateResponses(userInput) {
        try {
            showInferenceStatus(false);
            const requestUrl = `${API_BASE}/api/generate`;
            console.log('Sending request to:', requestUrl);
            console.log('Request headers:', getHeaders());
            console.log('Request body:', { userInput });
            
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: getHeaders(),
                credentials: 'omit',
                body: JSON.stringify({ userInput })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response text:', errorText);
                throw new Error(`Failed to generate responses: ${response.status} - ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!data.responses || !Array.isArray(data.responses) || data.responses.length !== 2) {
                console.error('Invalid response format:', data);
                throw new Error(`Invalid response format: ${JSON.stringify(data)}`);
            }
            
            return data.responses;
        } catch (error) {
            console.error('Error generating responses:', error);
            console.error('Error stack:', error.stack);
            return null;
        } finally {
            hideInferenceStatus();
        }
    }

    async function continueConversation(userInput) {
        try {
            showInferenceStatus(true);
            const response = await fetch(`${API_BASE}/api/generate`, {
                method: 'POST',
                headers: getHeaders(),
                credentials: 'omit',
                body: JSON.stringify({ 
                    userInput,
                    selectedModel 
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to generate response: ${response.status} - ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            hideInferenceStatus();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (data.response) {
                const estimatedTokens = Math.ceil(data.response.length / 4);
                await addMessage('helper', data.response, estimatedTokens);
                return data.response;
            } else {
                throw new Error('No response in data');
            }
        } catch (error) {
            console.error('Error generating response:', error);
            return null;
        }
    }

    function showOptions() {
        optionsContainer.style.display = 'flex';
        setTimeout(() => {
            optionsContainer.classList.add('visible');
            optionBoxes.forEach(box => box.classList.add('visible'));
        }, 300);
    }

    function displayMessage(text, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'response-message'}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messageDiv.scrollIntoView({ behavior: 'smooth' });

        const speaker = isUser ? 'user' : 'helper';
        const estimatedTokens = Math.ceil(text.length / 4);
        addMessage(speaker, text, estimatedTokens);
    }

    // Handle initial input submission
    initialInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter' && initialInput.value.trim()) {
            const userInput = initialInput.value.trim();
            initialInput.value = '';
            initialInput.disabled = true;

            displayMessage(userInput, true);
            initialInputContainer.classList.add('moved');
            
            const responses = await generateResponses(userInput);
            
            if (responses) {
                optionBoxes[0].textContent = responses[0].content;
                optionBoxes[1].textContent = responses[1].content;
                
                optionBoxes[0].dataset.model = responses[0].model;
                optionBoxes[1].dataset.model = responses[1].model;
                optionBoxes[0].dataset.content = responses[0].content;
                optionBoxes[1].dataset.content = responses[1].content;
                
                setTimeout(showOptions, 300);
            } else {
                displayMessage("I apologize, but I'm having trouble generating responses right now. Please try again.", false);
                initialInput.disabled = false;
                initialInputContainer.classList.remove('moved');
                initialInput.focus();
            }
        }
    });

    // Handle option selection
    optionBoxes.forEach((box, index) => {
        box.addEventListener('click', async () => {
            optionsContainer.style.display = 'none';
            initialInputContainer.classList.add('hidden');
            
            const selectedBox = box;
            const rejectedBox = optionBoxes[index === 0 ? 1 : 0];
            
            selectedModel = selectedBox.dataset.model;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message response-message';
            messageDiv.textContent = selectedBox.dataset.content;
            messagesContainer.appendChild(messageDiv);
            messageDiv.scrollIntoView({ behavior: 'smooth' });
            
            const responseMessage = await addMessage('helper', selectedBox.dataset.content, Math.ceil(selectedBox.dataset.content.length / 4));
            
            const lastUserMessage = conversationState.messages
                .filter(m => m.speaker === 'user')
                .pop();

            if (lastUserMessage) {
                try {
                    await fetch(`${API_BASE}/api/dpo`, {
                        method: 'POST',
                        headers: fetchHeaders,
                        credentials: 'omit',
                        body: JSON.stringify({
                            sessionId: conversationState.sessionId,
                            userInput: lastUserMessage.text,
                            chosenResponse: selectedBox.dataset.content,
                            rejectedResponse: rejectedBox.dataset.content,
                            timestamp: Date.now(),
                            conversationContext: conversationState.messages.slice(0, -1)
                        })
                    });
                    console.log('DPO data logged successfully');
                } catch (error) {
                    console.error('Error logging DPO data:', error);
                }
            }
            
            bottomInputContainer.classList.add('visible');
            tokenCounter.classList.add('visible');
        });
    });

    // Handle bottom input submission
    bottomInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter' && bottomInput.value.trim()) {
            const userInput = bottomInput.value.trim();
            bottomInput.value = '';
            bottomInput.disabled = true;

            displayMessage(userInput, true);
            
            const response = await continueConversation(userInput);
            
            if (response) {
                displayMessage(response, false);
            } else {
                displayMessage("I apologize, but I'm having trouble generating a response right now. Please try again.", false);
            }
            
            bottomInput.disabled = false;
            bottomInput.focus();
        }
    });

    // Add window unload handler to mark conversation as complete
    window.addEventListener('beforeunload', async () => {
        if (conversationState.messages.length > 0) {
            try {
                await fetch(`${API_BASE}/api/complete`, {
                    method: 'POST',
                    headers: fetchHeaders,
                    credentials: 'omit',
                    body: JSON.stringify({
                        sessionId: conversationState.sessionId
                    }),
                    keepalive: true
                });
            } catch (error) {
                console.error('Error marking conversation complete:', error);
            }
        }
    });
});
  