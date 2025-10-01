// Simple client-side authentication
const ADMIN_CREDENTIALS = {
    owner: { password: "your-secret-owner-password", role: "owner" },
    co_owner: { password: "your-secret-coowner-password", role: "co_owner" },
    admin: { password: "your-secret-admin-password", role: "admin" }
};

class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('ci_admin_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showAdminPanel();
        }
    }

    login(username, password) {
        const user = ADMIN_CREDENTIALS[username];
        if (user && user.password === password) {
            this.currentUser = {
                username,
                role: user.role,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('ci_admin_user', JSON.stringify(this.currentUser));
            this.showAdminPanel();
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('ci_admin_user');
        this.hideAdminPanel();
    }

    showAdminPanel() {
        // Create admin floating panel
        if (!document.getElementById('adminPanel')) {
            const adminPanel = document.createElement('div');
            adminPanel.id = 'adminPanel';
            adminPanel.innerHTML = `
                <div class="admin-panel">
                    <div class="admin-header">
                        <h4>🔧 Admin Panel</h4>
                        <span class="user-role">${this.currentUser.role}</span>
                        <button onclick="adminAuth.logout()" class="logout-btn">Logout</button>
                    </div>
                    <div class="admin-controls">
                        <button onclick="contentManager.toggleEdit()">✏️ Edit Content</button>
                        <button onclick="pageManager.showPageCreator()">📄 Add Page</button>
                        <button onclick="fileManager.showUploader()">📁 Upload File</button>
                        ${this.currentUser.role === 'owner' || this.currentUser.role === 'co_owner' ? 
                            `<button onclick="userManager.showUserPanel()">👥 Manage Users</button>` : ''}
                    </div>
                </div>
            `;
            document.body.appendChild(adminPanel);
        }
    }

    hideAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) panel.remove();
    }

    hasPermission(requiredRole) {
        const roleLevels = { moderator: 1, admin: 2, co_owner: 3, owner: 4 };
        return roleLevels[this.currentUser.role] >= roleLevels[requiredRole];
    }
}

// Initialize
const adminAuth = new AdminAuth();
