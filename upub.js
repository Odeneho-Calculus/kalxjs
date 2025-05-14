import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

const versions = ["1.2.0"
];
;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter your 2FA OTP: ', async (otp) => {
    rl.close();

    for (const version of versions) {
        try {
            const { stdout } = await execAsync(`npm unpublish @kalxjs/cli@${version} --force --otp=${otp}`);
            console.log(`✅ Unpublished @kalxjs/cli@${version}`);
        } catch (err) {
            console.error(`❌ Failed to unpublish ${version}:`, err.stderr || err.message);
        }
    }
});
