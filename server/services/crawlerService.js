const axios = require('axios');
const cheerio = require('cheerio');

const crawlPage = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const jobs = [];

    // 1. Look for LD+JSON JobPosting schema
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json['@type'] === 'JobPosting' || (Array.isArray(json['@graph']) && json['@graph'].some(item => item['@type'] === 'JobPosting'))) {
          const jobData = Array.isArray(json['@graph']) ? json['@graph'].find(item => item['@type'] === 'JobPosting') : json;
          jobs.push({
            title: jobData.title,
            company: jobData.hiringOrganization?.name,
            location: jobData.jobLocation?.address?.addressLocality,
            description: jobData.description,
            url: url,
            source: 'Schema.org',
            postedAt: jobData.datePosted
          });
        }
      } catch (e) {
        // Ignore malformed JSON
      }
    });
    
    // 1.5. Check for ATS signals in URL or content
    const atsMatch = url.match(/(greenhouse\.io|lever\.co|workday\.com|ashbyhq\.com|smartrecruiters\.com)/i);
    const detectedAts = atsMatch ? atsMatch[0].split('.')[0] : null;

    // 2. Fallback: Common patterns if no schema found
    if (jobs.length === 0) {
      // Very basic fallback - in reality, this would be much more complex
      const title = $('h1').first().text().trim();
      const company = $('meta[property="og:site_name"]').attr('content') || $('title').text().split('-')[0].trim();
      
      if (title && (title.toLowerCase().includes('engineer') || title.toLowerCase().includes('developer') || title.toLowerCase().includes('manager'))) {
        jobs.push({
          title,
          company,
          url,
          source: detectedAts || 'Generic Crawler',
          detectedAt: new Date()
        });
      }
    }

    // Update source for schema-based jobs if ATS was detected
    jobs.forEach(job => {
      if (detectedAts && !job.source) job.source = detectedAts;
    });

    return jobs;
  } catch (error) {
    console.error(`Crawler error at ${url}:`, error.message);
    return [];
  }
};

module.exports = { crawlPage };
