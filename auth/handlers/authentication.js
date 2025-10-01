class AuthorizationSystem {
    constructor(rolesConfig) {
        this.roles = rolesConfig.roles;
    }

    can(user, permission) {
        if (!user || !user.role) return false;
        
        const role = this.roles[user.role];
        if (!role) return false;

        // Check direct permissions
        if (this.checkPermission(role.permissions, permission)) {
            return true;
        }

        // Check inherited roles
        if (role.inherits) {
            for (const inheritedRole of role.inherits) {
                if (this.can({ role: inheritedRole }, permission)) {
                    return true;
                }
            }
        }

        return false;
    }

    checkPermission(permissions, requiredPermission) {
        return permissions.some(perm => {
            if (perm.endsWith('.*')) {
                const base = perm.slice(0, -2);
                return requiredPermission.startsWith(base);
            }
            return perm === requiredPermission;
        });
    }

    getRoleHierarchy() {
        return Object.keys(this.roles)
            .sort((a, b) => this.roles[b].level - this.roles[a].level);
    }
}
