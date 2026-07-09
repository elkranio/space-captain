const FtpDeploy = require('ftp-deploy');
const ftp = new FtpDeploy();
const path = require('path');

// Load environment variables from .env
require('dotenv').config();

const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    host: 'ftp.ha005.justhost.ru',
    port: 21,
    localRoot: path.resolve(__dirname, '../dist'),
    remoteRoot: '/domains/overhype.com/public_html/tests/_p34t',
    include: ['**/*'],
    deleteRemote: true,
    forcePasv: true,
    sftp: false,
};

// Fail fast if credentials are missing
if (!config.user || !config.password) {
    console.error('FTP credentials not set in .env (FTP_USER / FTP_PASS)');
    process.exit(1);
}

async function deploy() {
    ftp.on('uploading', (data) => {
        const { totalFilesCount, transferredFileCount, filename } = data;
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`📤 Uploading ${transferredFileCount}/${totalFilesCount}: ${filename}`);
    });

    try {
        const res = await ftp.deploy(config);
        console.log('Deployment complete.');
        console.log(res);
    } catch (err) {
        console.error('Deployment failed:', err);
    }
}

deploy();
