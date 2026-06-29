const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [{ name: 'commonName', value: '192.168.10.241' }];
async function run() {
  const pems = await selfsigned.generate(attrs, {
    algorithm: 'sha256',
    days: 365,
    keySize: 2048,
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: '192.168.10.241' }
        ]
      }
    ]
  });

  const certDir = path.join(__dirname, 'certificates');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
  }

  console.log(Object.keys(pems));
  fs.writeFileSync(path.join(certDir, 'key.pem'), pems.private || pems.privateKey);
  fs.writeFileSync(path.join(certDir, 'cert.pem'), pems.cert);
  console.log('Certificates generated successfully!');
}

run().catch(console.error);
