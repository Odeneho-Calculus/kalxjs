const { exec } = require("child_process");
const readline = require("readline");

// The package you want to interact with
const packageName = "@kalxjs/cli"; // Change this to your package name
const packageScope = "kalxjs"; // The scope of your package

// Initialize readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to get all versions of the package
function getPackageVersions() {
    return new Promise((resolve, reject) => {
        exec(`npm show ${packageName} versions --json`, (error, stdout, stderr) => {
            if (error || stderr) {
                reject(error || stderr);
            }
            resolve(JSON.parse(stdout));
        });
    });
}

// Function to prompt the user to delete a version
function promptDeleteVersion(version) {
    return new Promise((resolve) => {
        rl.question(`Do you want to delete version ${version}? [Y/N] `, (answer) => {
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

// Function to prompt for OTP (One-Time Password)
function promptOtp() {
    return new Promise((resolve) => {
        rl.question('Enter your 2FA OTP: ', (otp) => {
            resolve(otp);
        });
    });
}

// Function to unpublish a version
function unpublishVersion(version, otp) {
    return new Promise((resolve, reject) => {
        exec(`npm unpublish ${packageScope}/${packageName}@${version} --force --otp=${otp}`, (error, stdout, stderr) => {
            if (error || stderr) {
                reject(error || stderr);
            }
            resolve(stdout);
        });
    });
}

// Main function to list and prompt for deletions
async function main() {
    try {
        const versions = await getPackageVersions();

        for (const version of versions) {
            const shouldDelete = await promptDeleteVersion(version);
            if (shouldDelete) {
                const otp = await promptOtp(); // Prompt for OTP
                console.log(`Deleting version ${version}...`);
                await unpublishVersion(version, otp); // Use OTP for unpublishing
                console.log(`Version ${version} deleted.`);
            } else {
                console.log(`Skipping version ${version}.`);
            }
        }
        rl.close();
    } catch (error) {
        console.error("Error:", error);
        rl.close();
    }
}

// Run the script
main();
