/**
 * Modern Login System - Enhanced JavaScript
 * Using ES6+ and Fetch API for better performance
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModernLogin);
    } else {
        initModernLogin();
    }

    function initModernLogin() {
        const form = document.getElementById('modern-login-form-xqz789');
        if (!form) return; // Exit if form doesn't exist on page

        // State management
        const state = {
            currentStep: 1,
            username: '',
            attempts: 0,
            isLoading: false
        };

        // DOM Elements
        const elements = {
            form: form,
            usernameInput: document.getElementById('username-xqz789'),
            passwordInput: document.getElementById('password-xqz789'),
            rememberCheckbox: document.getElementById('remember-xqz789'),
            nextButton: document.querySelector('.btn-next-xqz789'),
            loginButton: document.querySelector('.btn-login-xqz789'),
            changeUserButton: document.querySelector('.btn-change-user-xqz789'),
            togglePasswordButton: document.querySelector('.btn-toggle-password-xqz789'),
            messageBox: document.querySelector('.message-box-xqz789'),
            usernameDisplay: document.querySelector('.username-display-xqz789'),
            avatarInitial: document.querySelector('.avatar-initial'),
            steps: document.querySelectorAll('.form-step-xqz789')
        };

        // Initialize
        init();

        function init() {
            setupEventListeners();
            loadSavedUsername();
            updateButtonStates();
            setFocusOnFirstInput();
        }

        /**
         * Setup all event listeners
         */
        function setupEventListeners() {
            // Input events with debouncing
            elements.usernameInput.addEventListener('input', debounce(handleUsernameInput, 300));
            elements.passwordInput.addEventListener('input', debounce(handlePasswordInput, 300));

            // Keyboard events
            elements.usernameInput.addEventListener('keypress', handleEnterKey);
            elements.passwordInput.addEventListener('keypress', handleEnterKey);

            // Button clicks
            elements.nextButton.addEventListener('click', handleNextStep);
            elements.loginButton.addEventListener('click', handleLogin);
            elements.changeUserButton.addEventListener('click', handleChangeUser);
            elements.togglePasswordButton.addEventListener('click', togglePasswordVisibility);

            // Form submission prevention
            elements.form.addEventListener('submit', (e) => e.preventDefault());

            // Focus events for better UX
            elements.usernameInput.addEventListener('focus', () => addFocusClass(elements.usernameInput));
            elements.usernameInput.addEventListener('blur', () => removeFocusClass(elements.usernameInput));
            elements.passwordInput.addEventListener('focus', () => addFocusClass(elements.passwordInput));
            elements.passwordInput.addEventListener('blur', () => removeFocusClass(elements.passwordInput));
        }

        /**
         * Handle username input changes
         */
        function handleUsernameInput(e) {
            state.username = e.target.value.trim();
            updateButtonStates();
            clearMessage();
        }

        /**
         * Handle password input changes
         */
        function handlePasswordInput(e) {
            updateButtonStates();
            clearMessage();
        }

        /**
         * Handle Enter key press
         */
        function handleEnterKey(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (state.currentStep === 1) {
                    handleNextStep();
                } else {
                    handleLogin();
                }
            }
        }

        /**
         * Handle next step button click
         */
        async function handleNextStep() {
            const username = elements.usernameInput.value.trim();
            
            if (!username) {
                showMessage(modernLoginConfig.i18n.usernameRequired, 'error');
                shakeElement(elements.usernameInput);
                return;
            }

            setLoadingState(elements.nextButton, true);

            try {
                const response = await fetchAPI('check_username_xqz789', { username });
                
                if (response.success) {
                    state.username = username;
                    setUserDisplay(username);
                    goToStep(2);
                    saveUsername(username);
                    
                    // Focus on password field after transition
                    setTimeout(() => {
                        elements.passwordInput.focus();
                    }, 300);
                } else {
                    showMessage(response.data.message || modernLoginConfig.i18n.userNotFound, 'error');
                    shakeElement(elements.usernameInput);
                }
            } catch (error) {
                showMessage(modernLoginConfig.i18n.connectionError, 'error');
                console.error('Username check error:', error);
            } finally {
                setLoadingState(elements.nextButton, false);
            }
        }

        /**
         * Handle login button click
         */
        async function handleLogin() {
            const password = elements.passwordInput.value;
            
            if (!password) {
                showMessage(modernLoginConfig.i18n.passwordRequired, 'error');
                shakeElement(elements.passwordInput);
                return;
            }

            if (state.isLoading) return;

            setLoadingState(elements.loginButton, true);
            state.isLoading = true;

            try {
                const response = await fetchAPI('modern_login_xqz789', {
                    username: state.username,
                    password: password,
                    remember: elements.rememberCheckbox.checked
                });

                if (response.success) {
                    showMessage(response.data.message || modernLoginConfig.i18n.loginSuccess, 'success');
                    
                    // Handle remember me
                    if (elements.rememberCheckbox.checked) {
                        saveUsername(state.username);
                    } else {
                        clearSavedUsername();
                    }

                    // Redirect after showing success message
                    setTimeout(() => {
                        window.location.href = response.data.redirect_url || modernLoginConfig.redirectUrl;
                    }, 1500);
                } else {
                    state.attempts++;
                    const message = response.data.message || modernLoginConfig.i18n.invalidCredentials;
                    
                    if (response.data.locked) {
                        showMessage(message, 'error');
                        elements.loginButton.disabled = true;
                        setTimeout(() => {
                            elements.loginButton.disabled = false;
                        }, 900000); // 15 minutes
                    } else {
                        if (response.data.attempts_remaining !== undefined) {
                            showMessage(`${message} (${response.data.attempts_remaining} attempts remaining)`, 'warning');
                        } else {
                            showMessage(message, 'error');
                        }
                        shakeElement(elements.passwordInput);
                        
                        // Clear password on failed attempt
                        elements.passwordInput.value = '';
                        elements.passwordInput.focus();
                    }
                }
            } catch (error) {
                showMessage(modernLoginConfig.i18n.connectionError, 'error');
                console.error('Login error:', error);
            } finally {
                setLoadingState(elements.loginButton, false);
                state.isLoading = false;
            }
        }

        /**
         * Handle change user button click
         */
        function handleChangeUser() {
            state.username = '';
            elements.usernameInput.value = '';
            elements.passwordInput.value = '';
            goToStep(1);
            clearMessage();
            
            setTimeout(() => {
                elements.usernameInput.focus();
            }, 300);
        }

        /**
         * Toggle password visibility
         */
        function togglePasswordVisibility() {
            const type = elements.passwordInput.type === 'password' ? 'text' : 'password';
            elements.passwordInput.type = type;
            
            // Toggle icons
            const showIcon = elements.togglePasswordButton.querySelector('.icon-show');
            const hideIcon = elements.togglePasswordButton.querySelector('.icon-hide');
            
            if (type === 'password') {
                showIcon.style.display = 'block';
                hideIcon.style.display = 'none';
                elements.togglePasswordButton.setAttribute('aria-label', 'Show password');
            } else {
                showIcon.style.display = 'none';
                hideIcon.style.display = 'block';
                elements.togglePasswordButton.setAttribute('aria-label', 'Hide password');
            }
        }

        /**
         * Navigate between form steps
         */
        function goToStep(step) {
            state.currentStep = step;
            
            elements.steps.forEach(stepEl => {
                stepEl.classList.remove('active');
            });
            
            const targetStep = document.querySelector(`.form-step-xqz789[data-step="${step}"]`);
            if (targetStep) {
                setTimeout(() => {
                    targetStep.classList.add('active');
                }, 50);
            }
        }

        /**
         * Set user display information
         */
        function setUserDisplay(username) {
            elements.usernameDisplay.textContent = username;
            const initial = username.charAt(0).toUpperCase();
            elements.avatarInitial.textContent = initial;
        }

        /**
         * Update button states based on input values
         */
        function updateButtonStates() {
            // Next button
            const usernameValid = elements.usernameInput.value.trim().length > 0;
            elements.nextButton.disabled = !usernameValid;

            // Login button
            const passwordValid = elements.passwordInput.value.length > 0;
            elements.loginButton.disabled = !passwordValid;
        }

        /**
         * Show message to user
         */
        function showMessage(message, type = 'error') {
            elements.messageBox.textContent = message;
            elements.messageBox.className = `message-box-xqz789 show ${type}`;
            
            // Announce to screen readers
            elements.messageBox.setAttribute('role', 'alert');
            
            // Auto-hide error messages after 5 seconds
            if (type === 'error' || type === 'warning') {
                setTimeout(clearMessage, 5000);
            }
        }

        /**
         * Clear message
         */
        function clearMessage() {
            elements.messageBox.classList.remove('show');
            setTimeout(() => {
                elements.messageBox.textContent = '';
                elements.messageBox.className = 'message-box-xqz789';
            }, 300);
        }

        /**
         * Set loading state on button
         */
        function setLoadingState(button, isLoading) {
            if (isLoading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
                updateButtonStates();
            }
        }

        /**
         * Add shake animation to element
         */
        function shakeElement(element) {
            element.style.animation = 'shake-xqz789 0.5s';
            setTimeout(() => {
                element.style.animation = '';
            }, 500);
        }

        /**
         * Add focus class for styling
         */
        function addFocusClass(element) {
            element.parentElement.classList.add('focused');
        }

        /**
         * Remove focus class
         */
        function removeFocusClass(element) {
            if (!element.value) {
                element.parentElement.classList.remove('focused');
            }
        }

        /**
         * Set focus on first input
         */
        function setFocusOnFirstInput() {
            setTimeout(() => {
                elements.usernameInput.focus();
            }, 100);
        }

        /**
         * Save username to localStorage
         */
        function saveUsername(username) {
            try {
                localStorage.setItem('modern_login_username_xqz789', username);
            } catch (e) {
                console.warn('Could not save username:', e);
            }
        }

        /**
         * Load saved username from localStorage
         */
        function loadSavedUsername() {
            try {
                const savedUsername = localStorage.getItem('modern_login_username_xqz789');
                if (savedUsername) {
                    elements.usernameInput.value = savedUsername;
                    state.username = savedUsername;
                    elements.rememberCheckbox.checked = true;
                    updateButtonStates();
                }
            } catch (e) {
                console.warn('Could not load saved username:', e);
            }
        }

        /**
         * Clear saved username from localStorage
         */
        function clearSavedUsername() {
            try {
                localStorage.removeItem('modern_login_username_xqz789');
            } catch (e) {
                console.warn('Could not clear saved username:', e);
            }
        }

        /**
         * Fetch API wrapper for AJAX requests
         */
        async function fetchAPI(action, data = {}) {
            const formData = new FormData();
            formData.append('action', action);
            formData.append('security', modernLoginConfig.security);
            
            for (const [key, value] of Object.entries(data)) {
                formData.append(key, value);
            }

            const response = await fetch(modernLoginConfig.ajaxurl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        }

        /**
         * Debounce function for input events
         */
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    }

    // Add shake animation styles if not exists
    if (!document.querySelector('#shake-animation-xqz789')) {
        const style = document.createElement('style');
        style.id = 'shake-animation-xqz789';
        style.textContent = `
            @keyframes shake-xqz789 {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

})();