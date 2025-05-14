import { exec } from "child_process";
import readline from "readline";

const versions = [
    "1.2.39", "1.2.38", "1.2.37", "1.2.36", "1.2.35", "1.2.34", "1.2.33", "1.2.32",
    "1.2.31", "1.2.30", "1.2.28", "1.2.26", "1.2.25", "1.2.24", "1.2.23", "1.2.22",
    "1.2.21", "1.2.20", "1.2.19", "1.2.18", "1.2.17", "1.2.16", "1.2.15", "1.2.14",
    "1.2.13", "1.2.12", "1.2.11", "1.2.10", "1.2.9", "1.2.8", "1.2.7", "1.2.6", "1.2.5",
    "1.2.4", "1.2.3", "1.2.2", "1.2.1", "1.2.0"
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function unpublishVersion(version) {
    const otp = await askQuestion("Enter your 2FA OTP: ");
    console.log(`Attempting to delete version ${version}...`);

    try {
        const result = await execPromise(`npm unpublish @kalxjs/cli@${version} --force --otp=${otp}`);
        console.log(`Successfully deleted version ${version}: ${result}`);
    } catch (stderr) {
        if (stderr.includes('Can only unpublish a single version, or the entire project')) {
            console.log(`Skipping version ${version}: Cannot unpublish specific versions.`);
        } else {
            console.log(`Error deleting version ${version}: ${stderr}`);
        }
    }
}

async function start() {
    for (const version of versions) {
        const deleteConfirmation = await askQuestion(`Do you want to delete version ${version}? [Y/N] `);

        if (deleteConfirmation.toLowerCase() === 'y') {
            await unpublishVersion(version);
        } else {
            console.log(`Skipping version ${version}.`);
        }
    }

    rl.close();
}

start();
