
class UserManager {
    constructor() {
        this.usersKey = 'ci_users_database';
        this.initializeDefaultUsers();
    }

    initializeDefaultUsers() {
        if (!localStorage.getItem(this.usersKey)) {
            const defaultUsers = {
                'owner': {
                    password: 'CI_Owner_2024!',
                    role: 'owner',
                    email: 'owner@ci-unit.classified',
                    created: new Date().toISOString(),
                    active: true
                },
                'co_owner': {
                    password: 'CI_CoOwner_2024!', 
                    role: 'co_owner',
                    email: 'coowner@ci-unit.classified',
                    created: new Date().toISOString(),
                    active: true
                },
                'admin': {
                    password: 'CI_Admin_2024!',
                    role: 'admin',
                    email: 'admin@ci-unit.classified', 
                    created: new Date().toISOString(),
                    active: true
                }
            };
            localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
        }
    }

    getAllUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey) || '{}');
    }

    saveAllUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    authenticate(username, password) {
        const users = this.getAllUsers();
        const user = users[username];
        
        if (user && user.password === password && user.active) {
            return {
                username: username,
                role: user.role,
                email: user.email,
                loginTime: new Date().toISOString()
            };
        }
        return null;
    }

    createUser(userData) {
        const users = this.getAllUsers();
        
        if (users[userData.username]) {
            return { success: false, error: 'Username already exists' };
        }

        users[userData.username] = {
            password: userData.password,
            role: userData.role,
            email: userData.email,
            created: new Date().toISOString(),
            createdBy: adminAuth.currentUser.username,
            active: true
        };

        this.saveAllUsers(users);
        return { success: true, user: userData };
    }

    updateUser(username, updates) {
        const users = this.getAllUsers();
        
        if (!users[username]) {
            return { success: false, error: 'User not found' };
        }

        // Don't allow changing your own role
        if (username === adminAuth.currentUser?.username && updates.role) {
            return { success: false, error: 'Cannot change your own role' };
        }

        Object.assign(users[username], updates);
        this.saveAllUsers(users);
        return { success: true };
    }

    deleteUser(username) {
        const users = this.getAllUsers();
        
        if (username === adminAuth.currentUser?.username) {
            return { success: false, error: 'Cannot delete your own account' };
        }

        if (users[username]) {
            delete users[username];
            this.saveAllUsers(users);
            return { success: true };
        }
        
        return { success: false, error: 'User not found' };
    }

    changePassword(username, newPassword) {
        const users = this.getAllUsers();
        
        if (users[username]) {
            users[username].password = newPassword;
            users[username].lastPasswordChange = new Date().toISOString();
            this.saveAllUsers(users);
            return { success: true };
        }
        
        return { success: false, error: 'User not found' };
    }

    showUserPanel() {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center;">
                <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; border: 2px solid var(--primary);">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: var(--primary); margin: 0;">👥 User Management</h3>
                        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: #ff4444; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">Close</button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- User List -->
                        <div>
                            <h4 style="color: var(--primary); margin-bottom: 15px;">Current Users</h4>
                            <div id="userList" style="background: #2a2a2a; border-radius: 10px; padding: 15px; max-height: 400px; overflow-y: auto;">
                                <!-- Users will be loaded here -->
                            </div>
                        </div>
                        
                        <!-- Add User Form -->
                        <div>
                            <h4 style="color: var(--primary); margin-bottom: 15px;">Add New User</h4>
                            <form id="addUserForm" style="background: #2a2a2a; border-radius: 10px; padding: 20px;">
                                <div style="margin-bottom: 15px;">
                                    <label style="display: block; color: var(--primary); margin-bottom: 5px;">Username</label>
                                    <input type="text" id="newUsername" required style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 5px;">
                                </div>
                                
                                <div style="margin-bottom: 15px;">
                                    <label style="display: block; color: var(--primary); margin-bottom: 5px;">Password</label>
                                    <input type="password" id="newPassword" required style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 5px;">
                                </div>
                                
                                <div style="margin-bottom: 15px;">
                                    <label style="display: block; color: var(--primary); margin-bottom: 5px;">Email</label>
                                    <input type="email" id="newEmail" style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 5px;">
                                </div>
                                
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: var(--primary); margin-bottom: 5px;">Role</label>
                                    <select id="newRole" required style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 5px;">
                                        <option value="member">Member</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="admin">Admin</option>
                                        ${adminAuth.currentUser.role === 'owner' ? '<option value="co_owner">Co-Owner</option>' : ''}
                                    </select>
                                </div>
                                
                                <button type="submit" style="width: 100%; padding: 12px; background: var(--primary); color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Create User</button>
                            </form>
                        </div>
                    </div>
                    
                    <div id="userManagementMessage" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.loadUserList();
        this.setupUserForm();
    }

    loadUserList() {
        const users = this.getAllUsers();
        const userList = document.getElementById('userList');
        
        userList.innerHTML = Object.entries(users).map(([username, user]) => `
            <div style="background: #1a1a1a; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #333;">
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <strong style="color: var(--primary);">${username}</strong>
                        <span style="background: ${this.getRoleColor(user.role)}; color: black; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 10px;">${user.role}</span>
                    </div>
                    <div>
                        ${username !== adminAuth.currentUser.username ? `
                            <button onclick="userManager.editUser('${username}')" style="background: var(--primary); color: black; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 5px;">Edit</button>
                            <button onclick="userManager.deleteUserPrompt('${username}')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">Delete</button>
                        ` : '<span style="color: var(--primary); font-size: 12px;">Current User</span>'}
                    </div>
                </div>
                <div style="font-size: 12px; color: #ccc;">
                    <div>Email: ${user.email || 'N/A'}</div>
                    <div>Created: ${new Date(user.created).toLocaleDateString()}</div>
                    <div>Status: <span style="color: ${user.active ? '#00ff88' : '#ff4444'}">${user.active ? 'Active' : 'Inactive'}</span></div>
                </div>
            </div>
        `).join('');
    }

    getRoleColor(role) {
        const colors = {
            'owner': '#ff4444',
            'co_owner': '#ffaa00', 
            'admin': '#00ff88',
            'moderator': '#0088ff',
            'member': '#888888'
        };
        return colors[role] || '#888888';
    }

    setupUserForm() {
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userData = {
                username: document.getElementById('newUsername').value,
                password: document.getElementById('newPassword').value,
                email: document.getElementById('newEmail').value,
                role: document.getElementById('newRole').value
            };

            const result = this.createUser(userData);
            this.showMessage(result.success ? 'User created successfully!' : result.error, result.success);
            
            if (result.success) {
                document.getElementById('addUserForm').reset();
                this.loadUserList();
            }
        });
    }

    editUser(username) {
        const users = this.getAllUsers();
        const user = users[username];
        
        const newRole = prompt(`Change role for ${username}:`, user.role);
        if (newRole && ['member', 'moderator', 'admin', 'co_owner'].includes(newRole)) {
            const result = this.updateUser(username, { role: newRole });
            this.showMessage(result.success ? 'User updated!' : result.error, result.success);
            if (result.success) this.loadUserList();
        }
    }

    deleteUserPrompt(username) {
        if (confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
            const result = this.deleteUser(username);
            this.showMessage(result.success ? 'User deleted!' : result.error, result.success);
            if (result.success) this.loadUserList();
        }
    }

    showMessage(message, isSuccess = true) {
        const messageDiv = document.getElementById('userManagementMessage');
        messageDiv.textContent = message;
        messageDiv.style.background = isSuccess ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 68, 0.2)';
        messageDiv.style.color = isSuccess ? '#00ff88' : '#ff4444';
        messageDiv.style.border = `1px solid ${isSuccess ? '#00ff88' : '#ff4444'}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Update your AdminAuth class to use the UserManager
class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.userManager = new UserManager();
        this.init();
    }

    // Update the login method to use UserManager
    login(username, password) {
        const user = this.userManager.authenticate(username, password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('ci_admin_user', JSON.stringify(this.currentUser));
            this.showAdminPanel();
            return true;
        }
        return false;
    }

    // ... rest of your existing AdminAuth methods
}

// Initialize the enhanced system
const userManager = new UserManager();
const adminAuth = new AdminAuth();
