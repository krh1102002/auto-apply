const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

const seedJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing jobs (optional, but good for testing)
    // await Job.deleteMany({});

    const jobs = [];
    const companies = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Tesla', 'Adobe', 'Oracle', 'IBM'];
    const locations = ['Remote', 'San Francisco', 'New York', 'London', 'Bangalore', 'Berlin'];

    for (let i = 1; i <= 50; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      jobs.push({
        title: `Software Engineer (Freshers) - Batch ${i}`,
        company,
        location,
        salary: `$${Math.floor(Math.random() * (120 - 60) + 60)}k`,
        description: `Exciting opportunity for entry-level Software Engineers at ${company}. Work on cutting-edge technologies.`,
        url: `https://careers.${company.toLowerCase()}.com/jobs/${i}`,
        source: 'Official API',
        experienceLevel: 'Entry',
        status: 'Open',
        detectedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Within past week
      });
    }

    await Job.insertMany(jobs);
    console.log(`Successfully seeded ${jobs.length} jobs.`);
    process.exit();
  } catch (err) {
    console.error('Error seeding jobs:', err);
    process.exit(1);
  }
};

seedJobs();
