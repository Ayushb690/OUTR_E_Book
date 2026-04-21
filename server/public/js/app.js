// Global App JS
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogout();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let user = null;
    
    try {
        if (userStr) {
            user = JSON.parse(userStr);
        }
    } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('user'); // Clear corrupted data
    }

    const guestLinks = document.querySelectorAll('.guest-link');
    const authLinks = document.querySelectorAll('.auth-link');
    const librarianActions = document.querySelectorAll('.librarian-action');

    if (token && user) {
        guestLinks.forEach(link => link.classList.add('d-none'));
        authLinks.forEach(link => link.classList.remove('d-none'));
        
        if (user.role === 'librarian') {
            librarianActions.forEach(action => action.classList.remove('d-none'));
        }
    } else {
        guestLinks.forEach(link => link.classList.remove('d-none'));
        authLinks.forEach(link => link.classList.add('d-none'));
        
        // Redirect if on protected page
        const protectedPages = ['/dashboard', '/books', '/suppliers', '/reports', '/requests'];
        const currentPath = window.location.pathname.replace(/\/$/, ''); // Remove trailing slash for comparison
        
        if (protectedPages.includes(currentPath)) {
            window.location.href = '/login';
        }
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        });
    }
}

function showAlert(message, type = 'danger') {
    const container = document.getElementById('alert-container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show rounded-4" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['x-auth-token'] = token;
    }

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(endpoint, config);
        const data = await response.json();
        
        if (response.status === 401) {
            // Unauthorized, clear token and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return null;
        }

        if (!response.ok) {
            throw new Error(data.msg || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
