const glob = require('glob');
const path = require('path');
const { NodeSSH } = require('node-ssh');

const myEnv = require('dotenv').config();
require('dotenv-expand')(myEnv);

const { REMOTE, REMOTE_KEY, DEPLOYMENT_PATH, MANIFEST_FILE } = process.env;

const distPath = path.resolve(__dirname, '../dist');

async function main() {
    console.log('Deployment started.');

    const manifest = glob.sync(distPath + '/**/*', { nodir: true }).map(file => file.replace(/^.+dist[\/\\]/, ''));

    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: REMOTE.split('@')[1],
            username: REMOTE.split('@')[0],
            privateKey: REMOTE_KEY,
        });

        console.log('Checking deployed files...');

        const { stdout: deployedManifest } = await exec(ssh, `test -f "${MANIFEST_FILE}" && cat "${MANIFEST_FILE}"`);

        if (deployedManifest) {
            console.log('Deployed files detected:');
            console.log(deployedManifest);
            console.log('Purging deployed files...');

            await exec(ssh, `cd "${DEPLOYMENT_PATH}" && cat "${MANIFEST_FILE}" | xargs rm -f`);
        }

        console.log('Making dirs...');

        await ssh.mkdir(DEPLOYMENT_PATH);
        await ssh.mkdir(path.dirname(MANIFEST_FILE));

        console.log('Transferring dist files...');

        const succeeded = await ssh.putDirectory(distPath, DEPLOYMENT_PATH, {
            recursive: true,
            concurrency: 10,
            tick: function(localPath, remotePath, error) {
                localPath = localPath.replace(/^.+dist[\/\\]/, '');

                if (error) {
                    console.error('x Transferring', localPath);
                } else {
                    console.log('√ Transferring', localPath);
                }
            },
        });

        if (!succeeded) {
            throw new Error('Failed to transfer the dist files.');
        }

        console.log('Transferring manifest...');

        await ssh.execCommand(`echo "${manifest.join('\n')}" > "${MANIFEST_FILE}"`);

    } finally {
        await ssh.dispose();
    }

    console.log('Deployment finished.');
}

async function exec(ssh, command) {
    console.log('ssh:', command);

    const result = await ssh.execCommand(command);

    if (result.stderr) {
        console.error(result.stderr);

        throw new Error('Error while executing command.');
    }

    return result;
}

main();
