// PROPER initial setup - NOT a single-use permanent password (GLI SCRIVO IO I COMMENTI COSI LA GENTE CAPISCE COSA STA ACCADENDO XD)
const readline = require('readline');
const authSystem = new AuthenticationSystem();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setupInitialOwner() {
    console.log('=== SECURE SYSTEM SETUP ===');
    console.log('Creating initial owner account...\n');
    
    const username = await question('Enter owner username: ');
    const password = await question('Enter strong password: ', true);
    const passwordConfirm = await question('Confirm password: ', true);
    
    if (password !== passwordConfirm) {
        console.error('Passwords do not match!');
        process.exit(1);
    }
    
    if (password.length < 12) {
        console.error('Password must be at least 12 characters!');
        process.exit(1);
    }
    
    const user = await authSystem.setupInitialAdmin({
        username,
        password
    });
    
    console.log('\n=== SETUP COMPLETE ===');
    console.log('Owner account created successfully!');
    console.log('MFA Secret:', user.mfaSecret);
    console.log('Recovery Codes:', user.recoveryCodes.join('\n'));
    console.log('\n⚠️  Save recovery codes in a secure location!');
    
    rl.close();
}

function question(prompt, hidden = false) {
    return new Promise((resolve) => {
        if (hidden) {
            const stdin = process.stdin;
            stdin.resume();
            stdin.setRawMode(true);
            stdin.setEncoding('utf8');
            
            let input = '';
            stdin.on('data', (char) => {
                switch (char) {
                    case '\n':
                    case '\r':
                    case '\u0004':
                        stdin.setRawMode(false);
                        console.log();
                        resolve(input);
                        break;
                    case '\u0003':
                        stdin.setRawMode(false);
                        console.log();
                        process.exit();
                        break;
                    case '\b':
                    case '\x7f':
                        input = input.slice(0, -1);
                        process.stdout.write('\b \b');
                        break;
                    default:
                        input += char;
                        process.stdout.write('*');
                        break;
                }
            });
        } else {
            rl.question(prompt, resolve);
        }
    });
}

setupInitialOwner().catch(console.error);
