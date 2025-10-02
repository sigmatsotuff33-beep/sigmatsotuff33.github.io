class SecurityMonitor {
    constructor() {
        this.logsKey = 'ci_security_logs';
        this.maxLogs = 1000;
        this.init();
    }

    init() {
        this.logVisitor();
        this.setupLoginMonitoring();
    }

    logVisitor() {
        const visitorInfo = this.collectVisitorData();
        this.saveLog(visitorInfo);
        this.displaySecurityAlert(visitorInfo);
    }

    collectVisitorData() {
        const visitorData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            connection: this.getConnectionInfo(),
            plugins: this.getPluginsInfo(),
            referrer: document.referrer || 'Direct visit',
            url: window.location.href,
            ip: 'Collecting...'
        };

        this.getIPAddress().then(ip => {
            visitorData.ip = ip;
            this.updateLogWithIP(visitorData);
        });

        return visitorData;
    }

    getIPAddress() {
        return fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => data.ip)
            .catch(() => 'Unknown');
    }

    updateLogWithIP(visitorData) {
        const logs = this.getLogs();
        const recentLog = logs[0];
        if (recentLog && recentLog.timestamp === visitorData.timestamp) {
            recentLog.ip = visitorData.ip;
            this.saveLogs(logs);
        }
    }

    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };
        }
        return 'Connection API not supported';
    }

    getPluginsInfo() {
        const plugins = [];
        if (navigator.plugins) {
            for (let i = 0; i < navigator.plugins.length; i++) {
                plugins.push(navigator.plugins[i].name);
            }
        }
        return plugins;
    }

    saveLog(visitorInfo) {
        const logs = this.getLogs();
        logs.unshift(visitorInfo);
        
        if (logs.length > this.maxLogs) {
            logs.splice(this.maxLogs);
        }
        
        localStorage.setItem(this.logsKey, JSON.stringify(logs));
    }

    getLogs() {
        return JSON.parse(localStorage.getItem(this.logsKey) || '[]');
    }

    saveLogs(logs) {
        localStorage.setItem(this.logsKey, JSON.stringify(logs));
    }

    displaySecurityAlert(visitorInfo) {
        const terminal = document.getElementById('opsTerminal');
        if (terminal) {
            const alertMessage = `
🚨 SECURITY ALERT 🚨
New visitor detected:
• Time: ${new Date(visitorInfo.timestamp).toLocaleString()}
• IP: ${visitorInfo.ip}
• OS: ${this.parseOS(visitorInfo.userAgent)}
• Browser: ${this.parseBrowser(visitorInfo.userAgent)}
• Platform: ${visitorInfo.platform}
• Language: ${visitorInfo.language}
• Screen: ${visitorInfo.screen.width}x${visitorInfo.screen.height}
• Timezone: ${visitorInfo.timezone}
• Referrer: ${visitorInfo.referrer}
• URL: ${visitorInfo.url}

            `;
            typeText(terminal, alertMessage + '\n');
        }
    }

    setupLoginMonitoring() {
        const originalLogin = adminAuth.login;
        adminAuth.login = (username, password) => {
            const result = originalLogin.call(adminAuth, username, password);
            if (result) {
                this.logUserLogin(username);
            }
            return result;
        };
    }

    logUserLogin(username) {
        const users = userManager.getAllUsers();
        const user = users[username];
        const loginInfo = {
            type: 'USER_LOGIN',
            timestamp: new Date().toISOString(),
            username: username,
            email: user ? user.email : 'Unknown',
            userAgent: navigator.userAgent,
            os: this.parseOS(navigator.userAgent),
            browser: this.parseBrowser(navigator.userAgent),
            ip: 'Collecting...'
        };

        this.getIPAddress().then(ip => {
            loginInfo.ip = ip;
            this.saveLog(loginInfo);
            this.displayLoginAlert(loginInfo);
        });
    }

    displayLoginAlert(loginInfo) {
        const terminal = document.getElementById('opsTerminal');
        if (terminal) {
            const loginMessage = `
🔐 USER LOGIN DETECTED 🔐
User authentication:
• Time: ${new Date(loginInfo.timestamp).toLocaleString()}
• Username: ${loginInfo.username}
• Email: ${loginInfo.email}
• IP: ${loginInfo.ip}
• OS: ${loginInfo.os}
• Browser: ${loginInfo.browser}
• User Agent: ${loginInfo.userAgent}

            `;
            typeText(terminal, loginMessage + '\n');
        }
    }

    parseOS(userAgent) {
        if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11';
        if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
        if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
        if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'MacOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
        return 'Unknown OS';
    }

    parseBrowser(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        return 'Unknown Browser';
    }

    showSecurityLogs() {
        const logs = this.getLogs();
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center;">
                <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 90%; max-height: 90vh; overflow-y: auto; border: 2px solid var(--primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: var(--primary); margin: 0;">🛡️ Security Logs</h3>
                        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: #ff4444; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">Close</button>
                    </div>
                    <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                        <button onclick="securityMonitor.exportLogs()" style="padding: 10px 15px; background: var(--primary); color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">💾 Export Logs</button>
                        <button onclick="securityMonitor.clearLogs()" style="padding: 10px 15px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">🗑️ Clear Logs</button>
                    </div>
                    <div id="securityLogsList" style="background: #2a2a2a; border-radius: 10px; padding: 15px; max-height: 60vh; overflow-y: auto;">
                        ${logs.map(log => this.formatLogEntry(log)).join('')}
                    </div>
                    <div style="margin-top: 15px; color: #ccc; font-size: 12px;">
                        Total logs: ${logs.length} | Max stored: ${this.maxLogs}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    formatLogEntry(log) {
        const isLogin = log.type === 'USER_LOGIN';
        const bgColor = isLogin ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 136, 255, 0.1)';
        const borderColor = isLogin ? '#00ff88' : '#0088ff';
        
        return `
            <div style="background: ${bgColor}; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <strong style="color: ${isLogin ? '#00ff88' : '#0088ff'};">${isLogin ? '🔐 LOGIN' : '👤 VISITOR'}</strong>
                        <span style="background: #333; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 10px;">${new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                </div>
                <div style="font-size: 12px; color: #ccc;">
                    ${isLogin ? `
                        <div><strong>User:</strong> ${log.username} (${log.email})</div>
                    ` : ''}
                    <div><strong>IP:</strong> ${log.ip || 'Unknown'}</div>
                    <div><strong>OS:</strong> ${log.os || this.parseOS(log.userAgent)}</div>
                    <div><strong>Browser:</strong> ${log.browser || this.parseBrowser(log.userAgent)}</div>
                    <div><strong>Platform:</strong> ${log.platform || 'Unknown'}</div>
                    ${isLogin ? '' : `<div><strong>Referrer:</strong> ${log.referrer || 'Direct'}</div>`}
                </div>
            </div>
        `;
    }

    exportLogs() {
        const logs = this.getLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ci-security-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    clearLogs() {
        if (confirm('Are you sure you want to clear all security logs? This cannot be undone.')) {
            localStorage.removeItem(this.logsKey);
            document.querySelector('div[style*="position: fixed"]').remove();
            this.showSecurityLogs();
        }
    }

    detectSuspiciousActivity() {
        const logs = this.getLogs();
        const recentLogs = logs.slice(0, 10);
        const uniqueIPs = new Set(recentLogs.map(log => log.ip));
        
        if (uniqueIPs.size > 3) {
            this.triggerSuspiciousAlert('Multiple IP addresses detected');
        }
    }

    triggerSuspiciousAlert(reason) {
        const terminal = document.getElementById('opsTerminal');
        if (terminal) {
            const alertMessage = `
🚨🚨 SUSPICIOUS ACTIVITY 🚨🚨
Reason: ${reason}
Time: ${new Date().toLocaleString()}
Action: Monitor closely

            `;
            typeText(terminal, alertMessage + '\n');
        }
    }
}
