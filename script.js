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
    let selectedModel = null;
    let startTime;
    let timerInterval;

    // Inference status handling
    function showInferenceStatus() {
        const statusEl = document.getElementById('inference-status');
        const timerEl = document.getElementById('timer');

        statusEl.style.display = 'flex';
        startTime = performance.now();

        timerInterval = setInterval(() => {
            const elapsed = performance.now() - startTime;
            timerEl.textContent = (elapsed / 1000).toFixed(1) + 's';
        }, 100);
    }

    function hideInferenceStatus() {
        const statusEl = document.getElementById('inference-status');
        statusEl.style.display = 'none';
        clearInterval(timerInterval);
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

    // Context refresh conditions
    function shouldRefreshContext() {
        const timeSinceLastRefresh = Date.now() - conversationState.lastContextRefresh;
        const messagesSinceLastRefresh = conversationState.messages
            .filter(m => m.timestamp > conversationState.lastContextRefresh).length;
        
        return messagesSinceLastRefresh > 10 || timeSinceLastRefresh > 5 * 60 * 1000;
    }

    // Message handling with token tracking
    async function addMessage(speaker, text, tokenUsage = 0) {
        const message = {
            speaker,
            text,
            timestamp: Date.now()
        };
        
        // Add to state
        conversationState.messages.push(message);
        conversationState.tokenCount += tokenUsage;
        updateTokenDisplay();
        
        // Save complete conversation state
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

    // Update token counter display
    function updateTokenDisplay() {
        const formattedCount = conversationState.tokenCount.toString().padStart(6, '0');
        tokenCounter.textContent = `${formattedCount} / 1,000,000`;
    }

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

    async function generateResponses(userInput) {
        try {
            showInferenceStatus();
            const requestUrl = `${API_BASE}/api/generate`;
            console.log('Sending request to:', requestUrl);
            console.log('Request headers:', fetchHeaders);
            console.log('Request body:', { userInput });
            
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: fetchHeaders,
                credentials: 'omit',
                body: JSON.stringify({ userInput })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers));

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
            showInferenceStatus();
            const response = await fetch(`${API_BASE}/api/generate`, {
                method: 'POST',
                headers: fetchHeaders,
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
            return data.response;
        } catch (error) {
            console.error('Error generating response:', error);
            return null;
        } finally {
            hideInferenceStatus();
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

        // Add to conversation state
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

            // Display user message
            displayMessage(userInput, true);
            
            // Start fade out of input
            initialInputContainer.classList.add('moved');
            
            // Generate responses
            const responses = await generateResponses(userInput);
            
            if (responses) {
                // Update option boxes with generated responses
                optionBoxes[0].textContent = responses[0].content;
                optionBoxes[1].textContent = responses[1].content;
                
                // Store responses for DPO logging
                optionBoxes[0].dataset.model = responses[0].model;
                optionBoxes[1].dataset.model = responses[1].model;
                optionBoxes[0].dataset.content = responses[0].content;
                optionBoxes[1].dataset.content = responses[1].content;
                
                // Show options after input fades
                setTimeout(showOptions, 300);
            } else {
                // Handle error
                displayMessage("I apologize, but I'm having trouble generating responses right now. Please try again.", false);
                initialInput.disabled = false;
                initialInputContainer.classList.remove('moved');
                initialInput.focus(); // Maintain focus on error
            }
        }
    });

    // Handle option selection
    optionBoxes.forEach((box, index) => {
        box.addEventListener('click', async () => {
            // Hide options immediately
            optionsContainer.style.display = 'none';
            initialInputContainer.classList.add('hidden');
            
            // Get the selected and rejected responses
            const selectedBox = box;
            const rejectedBox = optionBoxes[index === 0 ? 1 : 0];
            
            // Store selected model for continued conversation
            selectedModel = selectedBox.dataset.model;
            
            // Create and display the message div first
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message response-message';
            messageDiv.textContent = selectedBox.dataset.content;
            messagesContainer.appendChild(messageDiv);
            messageDiv.scrollIntoView({ behavior: 'smooth' });
            
            // Add response message to state
            const responseMessage = await addMessage('helper', selectedBox.dataset.content, Math.ceil(selectedBox.dataset.content.length / 4));
            
            // Now we can safely access the last user message
            const lastUserMessage = conversationState.messages
                .filter(m => m.speaker === 'user')
                .pop();

            if (lastUserMessage) {
                try {
                    // Log DPO data
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
                            conversationContext: conversationState.messages.slice(0, -1) // Include conversation context up to this point
                        })
                    });
                    console.log('DPO data logged successfully');
                } catch (error) {
                    console.error('Error logging DPO data:', error);
                }
            }
            
            // Show bottom input
            bottomInputContainer.classList.add('visible');
            
            // Show token counter
            tokenCounter.classList.add('visible');
        });
    });

    // Handle bottom input submission
    bottomInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter' && bottomInput.value.trim()) {
            const userInput = bottomInput.value.trim();
            bottomInput.value = '';
            bottomInput.disabled = true;

            // Display user message
            displayMessage(userInput, true);
            
            // Generate response using selected model
            const response = await continueConversation(userInput);
            
            if (response) {
                displayMessage(response, false);
            } else {
                displayMessage("I apologize, but I'm having trouble generating a response right now. Please try again.", false);
            }
            
            bottomInput.disabled = false;
            bottomInput.focus(); // Maintain focus after response
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
                    // Use keepalive to ensure the request completes
                    keepalive: true
                });
            } catch (error) {
                console.error('Error marking conversation complete:', error);
            }
        }
    });
});
  