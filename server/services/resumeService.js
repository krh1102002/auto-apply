const pdf = require('pdf-parse');

const parseResume = async (buffer) => {
  try {
    const data = await pdf(buffer);
    const text = data.text;

    // Simple extraction logic (Regex & Keyword matching)
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    
    // Skill extraction (Mock list of common tech skills)
    const commonSkills = [
      'javascript', 'react', 'node.js', 'mongodb', 'python', 'java', 'c++', 
      'aws', 'docker', 'kubernetes', 'typescript', 'express', 'sql', 'nosql',
      'tailwindcss', 'html', 'css', 'redux', 'git', 'rest api', 'graphql'
    ];
    
    const detectedSkills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      skills: detectedSkills,
      rawText: text.substring(0, 1000) // Keep a snippet of raw text
    };
  } catch (error) {
    console.error('Resume parsing error:', error.message);
    throw new Error('Failed to parse resume');
  }
};

module.exports = { parseResume };
