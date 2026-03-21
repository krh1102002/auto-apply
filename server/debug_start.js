try {
  require('./index.js');
} catch (err) {
  console.error('FULL ERROR STACK:');
  console.error(err.stack);
  process.exit(1);
}
