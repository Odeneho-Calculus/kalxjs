const { exec } = require("child_process");

const versions = [
    "1.3.25",
    "1.3.24",
    "1.3.18",
    "0.1.3",
    "1.3.17",
    "1.3.16",
    "1.3.15"
];

versions.forEach((version) => {
    exec(`npm unpublish @kalxjs/cli@${version} --force`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error removing version ${version}:`, stderr);
        } else {
            console.log(`Unpublished @kalxjs/cli@${version}`);
        }
    });
});
