const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const hashed = await bcrypt.hash('password123', 10);
    await User.updateOne(
      { email: 'hrishikeshikasarwadnya@gmail.com' },
      { $set: { password: hashed } },
      { upsert: true }
    );
    console.log('CREDENTIALS_READY');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
