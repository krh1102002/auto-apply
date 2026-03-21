const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

const realJobUrls = [
  "https://boards.greenhouse.io/canonical/jobs/3257589",
  "https://boards.greenhouse.io/databricks/jobs/7979523002",
  "https://boards.greenhouse.io/aurorainnovation/jobs/8204427002",
  "https://boards.greenhouse.io/sofi/jobs/7575332003",
  "https://boards.greenhouse.io/invisibletech/jobs/4691650101",
  "https://boards.greenhouse.io/spacex/jobs/8209766002",
  "https://boards.greenhouse.io/opswat/jobs/4278068005",
  "https://boards.greenhouse.io/rdccareers/jobs/7453218003",
  "https://boards.greenhouse.io/canonical/jobs/2969042",
  "https://boards.greenhouse.io/wehrtyou/jobs/6139035",
  "https://boards.greenhouse.io/mongodb/jobs/7264736",
  "https://boards.greenhouse.io/gleanwork/jobs/4012745005",
  "https://boards.greenhouse.io/databricks/jobs/7958676002",
  "https://boards.greenhouse.io/aurorainnovation/jobs/8159580002",
  "https://boards.greenhouse.io/databricks/jobs/8278343002",
  "https://boards.greenhouse.io/samsara/jobs/7317691",
  "https://boards.greenhouse.io/dataiku/jobs/5420293004",
  "https://boards.greenhouse.io/octave/jobs/8302348002",
  "https://boards.greenhouse.io/databricks/jobs/8220958002",
  "https://boards.greenhouse.io/okta/jobs/6874019",
  "https://boards.greenhouse.io/databricks/jobs/7850582002",
  "https://boards.greenhouse.io/robinhood/jobs/7066515",
  "https://boards.greenhouse.io/databricks/jobs/7319791002",
  "https://boards.greenhouse.io/jumo/jobs/5886283",
  "https://boards.greenhouse.io/mongodb/jobs/7111375",
  "https://boards.greenhouse.io/credera/jobs/7505489",
  "https://boards.greenhouse.io/databricks/jobs/8012800002",
  "https://boards.greenhouse.io/canonical/jobs/5142922",
  "https://boards.greenhouse.io/canonical/jobs/4124053",
  "https://boards.greenhouse.io/sofi/jobs/7571878003",
  "https://boards.greenhouse.io/datadog/jobs/6451431",
  "https://jobs.lever.co/cscgeneration-2/a5b3aef8-b02a-4436-832d-60be4fdc66cc",
  "https://jobs.lever.co/mytos/fa8535f4-bc57-47f3-b0d0-327e1702fcea",
  "https://jobs.lever.co/leverdemo-8/ae8bc3d9-37e2-44aa-b18a-256f74c1b9fe/apply",
  "https://jobs.lever.co/foresea-technologies/9792d877-0771-4999-8d77-76b35950816d",
  "https://jobs.lever.co/3pillarglobal/02b0c749-9aba-4ed6-9693-74d019586553",
  "https://jobs.lever.co/supernovacompanies/68e224c9-e125-4e3f-9acd-065c0fc94bba",
  "https://jobs.lever.co/bloomon/086a4fb4-b26c-418b-8a46-e850d5794792",
  "https://jobs.lever.co/whoop/8c77d50c-0dfe-4fbb-bc15-ad0ebad5eada",
  "https://jobs.lever.co/megaport/fe639bb0-a68a-4fe4-b8f2-91bf575e7b78",
  "https://jobs.lever.co/rewaatech/9c7ad32c-4c5b-490e-b472-9b47b56daed3",
  "https://jobs.lever.co/zocks/5fbdafb5-0796-49f4-a6da-0b58615503e5",
  "https://jobs.lever.co/whoop/e52bfb59-5a57-4e23-9991-88ef1b3dd745",
  "https://jobs.lever.co/veeva/8fe22df0-02b4-453d-919c-c8998cf913f6",
  "https://jobs.lever.co/wolve/b42f4d54-02e1-4549-a6a5-7cd5673c8216",
  "https://jobs.lever.co/whoop/02b3ba78-ccb4-40a4-94b3-6b14c71eed9e",
  "https://jobs.lever.co/zocks/e1fb8267-cc53-4aa5-bfe0-09bfe6805318",
  "https://jobs.lever.co/addx/9f42c2a4-4ac7-43c3-8586-cd33512ac090",
  "https://jobs.lever.co/octoenergy/19fee9c5-63e9-44bc-86a1-dfb6eabf5f64",
  "https://jobs.lever.co/palantir/15844944-fb69-4b57-9531-e988650b20c6/apply"
];

const seedRealJobs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const jobs = realJobUrls.map((url, i) => {
      const isGreenhouse = url.includes('greenhouse.io');
      const companyPart = url.split('/')[3];
      const company = companyPart.charAt(0).toUpperCase() + companyPart.slice(1);

      return {
        title: `Software Engineer (Entry Level) - Real Posting ${i+1}`,
        company: company,
        location: 'Remote / Various',
        description: `Real job posting found on ${isGreenhouse ? 'Greenhouse' : 'Lever'}. Automation will hit this URL directly.`,
        url: url,
        source: isGreenhouse ? 'Greenhouse' : 'Lever',
        experienceLevel: 'Entry',
        status: 'Open'
      };
    });

    // Clear and insert
    await Job.deleteMany({ source: { $in: ['Greenhouse', 'Lever'] } });
    await Job.insertMany(jobs);

    console.log(`Successfully seeded ${jobs.length} REAL jobs.`);
    process.exit();
  } catch (err) {
    console.error('Error seeding real jobs:', err);
    process.exit(1);
  }
};

seedRealJobs();
