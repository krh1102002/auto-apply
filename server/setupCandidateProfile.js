const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');

const PROFILE = {
  name: 'Sanika Sarwadnya',
  email: 'sanikasarwadnya@gmail.com',
  password: process.env.CANDIDATE_PASSWORD || 'TempPassword@123',
  resumeUrl: 'local-resume-path',
  preferences: {
    skills: [
      'Core Java', 'Advanced Java', 'JavaScript', 'TypeScript', 'Kotlin', 'Swift',
      'Spring Boot', 'React.js', 'Angular.js', 'Node.js', 'Express.js', 'React Native',
      'MySQL', 'PostgreSQL', 'REST APIs', 'HTML', 'CSS', 'SCSS', 'Bootstrap', 'Tailwind CSS'
    ],
    roles: [
      'Software Engineer', 'Full Stack Developer', 'Java Developer',
      'Android Developer', 'iOS Developer', 'Backend Developer', 'Frontend Developer'
    ],
    locations: ['Global', 'Remote', 'India']
  }
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: PROFILE.email });
    if (existing) {
      existing.name = PROFILE.name;
      existing.resumeUrl = PROFILE.resumeUrl;
      existing.preferences = PROFILE.preferences;
      await existing.save();
      console.log('✅ Candidate user updated.');
    } else {
      const user = new User(PROFILE);
      await user.save();
      console.log('✅ Candidate user created.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Candidate setup failed:', err.message);
    process.exit(1);
  }
};

run();
