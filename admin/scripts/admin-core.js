class AdminCore {
    constructor() {
        this.currentUser = null;
        this.currentView = 'dashboardView';
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        await this.loadComponents();
        this.setupEventListeners();
    }

    async checkAuthentication() {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const response = await fetch('/api/admin/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Invalid token');
            
            this.currentUser = await response.json();
            this.updateUI();
        } catch (error) {
            localStorage.removeItem('admin_token');
            window.location.href = 'index.html';
        }
    }

    async loadComponents() {
        // Load sidebar
        const sidebar = await this.fetchComponent('components/sidebar.html');
        document.getElementById('adminSidebar').innerHTML = sidebar;

        // Load header
        const header = await this.fetchComponent('components/header.html');
        document.getElementById('adminHeader').innerHTML = header;

        // Load modals
        const modalContainer = document.getElementById('modalContainer');
        const modals = await Promise.all([
            this.fetchComponent('components/modals/create-page.html'),
            this.fetchComponent('components/modals/upload-file.html'),
            this.fetchComponent('components/modals/edit-content.html')
        ]);
        modalContainer.innerHTML = modals.join('');
    }

    async fetchComponent(path) {
        const response = await fetch(path);
        return await response.text();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-view]')) {
                this.showView(e.target.getAttribute('data-view'));
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
            mfaCode: formData.get('mfaCode')
        };

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                const { token, user } = await response.json();
                localStorage.setItem('admin_token', token);
                window.location.href = 'dashboard.html';
            } else {
                this.showError('Authentication failed');
            }
        } catch (error) {
            this.showError('Network error');
        }
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
            
            // Load view-specific data
            this.loadViewData(viewName);
        }
    }

    async loadViewData(viewName) {
        switch (viewName) {
            case 'pagesView':
                await this.loadPages();
                break;
            case 'filesView':
                await this.loadFiles();
                break;
            case 'linksView':
                await this.loadLinks();
                break;
            case 'usersView':
                await this.loadUsers();
                break;
            case 'dashboardView':
                await this.loadDashboardStats();
                break;
        }
    }

    async loadDashboardStats() {
        try {
            const stats = await this.apiCall('/api/admin/stats');
            document.getElementById('pagesCount').textContent = stats.pages;
            document.getElementById('filesCount').textContent = stats.files;
            document.getElementById('usersCount').textContent = stats.users;
            document.getElementById('linksCount').textContent = stats.links;
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) throw new Error('API call failed');
        return await response.json();
    }

    showError(message) {
        // Create and show error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    logout() {
        localStorage.removeItem('admin_token');
        window.location.href = 'index.html';
    }
}

// Initialize admin core when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminCore = new AdminCore();
});

// Global functions for HTML onclick handlers
function showView(viewName) {
    window.adminCore.showView(viewName);
}

function openCreatePageModal() {
    // Implementation for create page modal
    console.log('Open create page modal');
}

function openUploadModal() {
    // Implementation for upload modal
    console.log('Open upload modal');
}
