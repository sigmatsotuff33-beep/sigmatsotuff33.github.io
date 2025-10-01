const crypto = require('crypto');

class AuthenticationSystem {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.auditLog = [];
    }

    // PROPER multi-factor setup instead of single-use password
    async setupInitialAdmin(userData) {
        const userId = crypto.randomUUID();
        const salt = crypto.randomBytes(16);
        const passwordHash = await this.hashPassword(userData.password, salt);
        
        const user = {
            id: userId,
            username: userData.username,
            passwordHash,
            salt,
            role: 'owner',
            createdAt: new Date(),
            mfaSecret: this.generateMFASecret(),
            recoveryCodes: this.generateRecoveryCodes(),
            isInitialSetup: true
        };
        
        this.users.set(userId, user);
        this.logAudit('OWNER_ACCOUNT_CREATED', userId);
        return user;
    }

    // Secure co-owner invitation system
    async inviteCoOwner(inviterId, inviteeData) {
        const inviter = this.users.get(inviterId);
        if (!inviter || !['owner', 'co_owner'].includes(inviter.role)) {
            throw new Error('Insufficient permissions');
        }

        const invitation = {
            id: crypto.randomUUID(),
            inviteeEmail: inviteeData.email,
            inviterId: inviterId,
            role: 'co_owner',
            token: crypto.randomBytes(32).toString('hex'),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            used: false
        };

        this.logAudit('CO_OWNER_INVITED', inviterId, invitation.id);
        return this.sendInvitationEmail(invitation);
    }

    async hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    }

    generateMFASecret() {
        return crypto.randomBytes(20).toString('base64');
    }

    generateRecoveryCodes() {
        const codes = [];
        for (let i = 0; i < 8; i++) {
            codes.push(crypto.randomBytes(8).toString('hex').toUpperCase());
        }
        return codes;
    }

    logAudit(action, userId, details = '') {
        this.auditLog.push({
            timestamp: new Date(),
            action,
            userId,
            details
        });
    }
}
