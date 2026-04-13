const { spawn } = require('child_process');
const server = spawn('node', ['index.js'], { cwd: __dirname });

server.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

setTimeout(() => {
  console.log('Test complete, killing server...');
  server.kill();
  process.exit(0);
}, 10000);
