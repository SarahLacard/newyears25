class ModalManager {
    constructor() {
        this.state = {
            activeModal: null,
            privacyNoticeVisible: false,
            countdownInterval: null,
            transitionInProgress: false,
            countdown: 12
        };
        this.elements = {};
    }

    init({ privacyNotice, helpModal, settingsModal }) {
        this.elements = { privacyNotice, helpModal, settingsModal };
        console.log('ModalManager initialized');
        
        // Start privacy notice after a short delay
        setTimeout(() => this.startPrivacyNotice(), 300);
        
        // Update countdown display
        const countdownEl = privacyNotice.querySelector('#countdown');
        if (countdownEl) {
            countdownEl.textContent = this.state.countdown;
        }
    }

    startPrivacyNotice() {
        if (this.state.transitionInProgress) return;
        
        console.log('Starting privacy notice countdown');
        this.state.privacyNoticeVisible = true;
        this.elements.privacyNotice.classList.add('show');
        
        const countdownEl = this.elements.privacyNotice.querySelector('#countdown');
        this.state.countdownInterval = setInterval(() => {
            this.state.countdown--;
            if (countdownEl) {
                countdownEl.textContent = this.state.countdown;
            }
            if (this.state.countdown <= 0) {
                this.hidePrivacyNotice();
            }
        }, 1000);
    }

    async hidePrivacyNotice() {
        if (!this.state.privacyNoticeVisible) return;
        
        console.log('Hiding privacy notice');
        this.state.privacyNoticeVisible = false;
        clearInterval(this.state.countdownInterval);
        this.elements.privacyNotice.classList.remove('show');
    }

    async open(modalType) {
        if (this.state.transitionInProgress) {
            console.log(`Modal transition in progress, ignoring ${modalType} open request`);
            return;
        }
        
        try {
            this.state.transitionInProgress = true;
            console.log(`Opening ${modalType} modal`);

            if (this.state.privacyNoticeVisible) {
                await this.hidePrivacyNotice();
            }

            if (this.state.activeModal && this.state.activeModal !== modalType) {
                await this.close(this.state.activeModal);
            }

            const modalEl = this._getModalElement(modalType);
            modalEl.style.display = 'flex';
            this.state.activeModal = modalType;

        } catch (error) {
            console.error(`Error opening ${modalType} modal:`, error);
        } finally {
            this.state.transitionInProgress = false;
        }
    }

    async close(modalType) {
        const modalEl = this._getModalElement(modalType);
        modalEl.style.display = 'none';
        
        if (this.state.activeModal === modalType) {
            this.state.activeModal = null;
        }

        console.log(`Closed ${modalType} modal`);
    }

    _getModalElement(modalType) {
        const modal = this.elements[`${modalType}Modal`];
        if (!modal) {
            throw new Error(`Unknown modal type: ${modalType}`);
        }
        return modal;
    }
} 