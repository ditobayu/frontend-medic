// Authentication utilities
class Auth {
    static setToken(token) {
        localStorage.setItem('token', token);
    }
    
    static getToken() {
        return localStorage.getItem('token');
    }
    
    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
    
    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    
    static isLoggedIn() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Helper methods for CRUD operations
    static async get(url) {
        return await this.makeAuthenticatedRequest(url, {
            method: 'GET'
        });
    }

    static async post(url, data) {
        return await this.makeAuthenticatedRequest(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(url, data) {
        return await this.makeAuthenticatedRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(url) {
        return await this.makeAuthenticatedRequest(url, {
            method: 'DELETE'
        });
    }
    
    static async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const requestOptions = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (response.status === 401 || response.status === 403) {
                this.logout();
                window.location.href = 'index.html';
                return;
            }
            
            return response;
            
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// API endpoints
const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
    LOGOUT: `${API_BASE_URL}/logout`,
    DATA_MEDIS: `${API_BASE_URL}/data-medis`,
    DATA_MEDIS_BY_ID: (id) => `${API_BASE_URL}/data-medis/${id}`
};

// Utility functions
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    const errorText = errorElement.querySelector('#errorText') || errorElement.querySelector('span');
    
    if (errorText) {
        errorText.textContent = message;
    }
    errorElement.classList.remove('hidden');
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.classList.add('hidden');
}

function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    const successText = successElement.querySelector('#successText') || successElement.querySelector('span');
    
    if (successText) {
        successText.textContent = message;
    }
    successElement.classList.remove('hidden');
}

function hideSuccess(elementId) {
    const successElement = document.getElementById(elementId);
    successElement.classList.add('hidden');
}

// Form validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Loading state utilities
function setButtonLoading(buttonId, loadingText) {
    const button = document.getElementById(buttonId);
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
}

function resetButtonLoading(buttonId) {
    const button = document.getElementById(buttonId);
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
}

// Export for global use
window.Auth = Auth;
window.API_ENDPOINTS = API_ENDPOINTS;

// Global fetch interceptor to ensure all API calls include token
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Only intercept API calls to our backend
    if (typeof url === 'string' && url.includes(API_BASE_URL)) {
        const token = Auth.getToken();
        
        if (token) {
            // Ensure headers exist
            options.headers = options.headers || {};
            
            // Add Authorization header if not already present
            if (!options.headers.Authorization && !options.headers.authorization) {
                options.headers.Authorization = `Bearer ${token}`;
            }
            
            // Add Content-Type for POST/PUT requests if not present
            const hasBody = options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH');
            if (hasBody && !options.headers['Content-Type'] && !options.headers['content-type']) {
                options.headers['Content-Type'] = 'application/json';
            }
        }
    }
    
    return originalFetch.call(this, url, options);
};
