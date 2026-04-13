const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { generateAnswer } = require('./aiService');

const SEMANTIC_MAP = {
  first_name: ['first name', 'given name', 'fname'],
  last_name: ['last name', 'family name', 'lname', 'surname'],
  email: ['email', 'e-mail'],
  phone: ['phone', 'mobile', 'cell', 'contact number'],
  resume: ['resume', 'cv', 'curriculum vitae', 'upload'],
  linkedin: ['linkedin', 'link'],
  website: ['website', 'portfolio', 'github', 'url'],
  location: ['location', 'city', 'address'],
  company: ['company', 'organization', 'current employer']
};

const DEFAULT_RESUME_PATH = process.env.RESUME_FILE_PATH
  || String.raw`C:\Users\hulke\AppData\Roaming\Cursor\User\workspaceStorage\7561ef34e49bb30f8e9262141fc8bbe9\pdfs\ef8fb15a-e8ea-4127-bb2d-6832ea78135b\Sanika_Sarwadnya (1).pdf`;

const findLabelForInput = async (page, input) => {
  return await page.evaluate(el => {
    // 1. Label with 'for' attribute
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) return label.innerText;
    }
    // 2. Parent label
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.innerText;
    
    // 3. Previous sibling label
    const prev = el.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return prev.innerText;
    
    // 4. Placeholder
    if (el.placeholder) return el.placeholder;
    
    // 5. Aria-label
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    
    return '';
  }, input);
};

const solveUniversalForm = async (page, userProfile) => {
  console.log('🤖 Engaging Universal Form Solver 2.0...');
  
  const inputs = await page.$$('input, textarea, select');
  const filledFields = new Set();

  for (const input of inputs) {
    const labelText = (await findLabelForInput(page, input)).toLowerCase();
    const name = (await page.evaluate(el => el.name || el.id || '', input)).toLowerCase();
    const type = (await page.evaluate(el => el.type || '', input)).toLowerCase();
    
    let valueToFill = null;

    // Semantic matching
    if (SEMANTIC_MAP.first_name.some(kw => labelText.includes(kw) || name.includes(kw))) {
      valueToFill = userProfile.name.split(' ')[0];
    } else if (SEMANTIC_MAP.last_name.some(kw => labelText.includes(kw) || name.includes(kw))) {
      valueToFill = userProfile.name.split(' ').slice(1).join(' ') || 'User';
    } else if (SEMANTIC_MAP.email.some(kw => labelText.includes(kw) || name.includes(kw))) {
      valueToFill = userProfile.email;
    } else if (SEMANTIC_MAP.phone.some(kw => labelText.includes(kw) || name.includes(kw))) {
      valueToFill = userProfile.phone || '555-0199';
    } else if (SEMANTIC_MAP.linkedin.some(kw => labelText.includes(kw) || name.includes(kw))) {
      valueToFill = userProfile.preferences?.linkedin || 'https://linkedin.com/in/testuser';
    } else if (SEMANTIC_MAP.website.some(kw => labelText.includes(kw) || name.includes(kw))) {
      valueToFill = userProfile.preferences?.github || 'https://github.com/testuser';
    }

    if (valueToFill && !filledFields.has(input)) {
      try {
        await input.type(valueToFill);
        filledFields.add(input);
      } catch (e) {}
    }

    // Handle File Upload (Resume)
    if (type === 'file' && SEMANTIC_MAP.resume.some(kw => labelText.includes(kw) || name.includes(kw))) {
      try {
        const resumePath = userProfile?.resumePath || DEFAULT_RESUME_PATH;
        if (!fs.existsSync(resumePath)) {
          throw new Error(`Resume file not found at: ${resumePath}`);
        }
        await input.uploadFile(resumePath);
        console.log('✅ Resume uploaded automatically.');
      } catch (e) {
        console.error('Failed to upload resume:', e.message);
      }
    }
  }

  // Handle remaining textareas with AI
  const textareas = await page.$$('textarea');
  for (const ta of textareas) {
    if (!filledFields.has(ta)) {
      const label = await findLabelForInput(page, ta);
      const answer = generateAnswer(label);
      await ta.type(answer);
      filledFields.add(ta);
    }
  }
};

const solveGreenhouse = async (page, userProfile) => {
  await solveUniversalForm(page, userProfile);
};

const solveLever = async (page, userProfile) => {
  await solveUniversalForm(page, userProfile);
};

const automateApplication = async (applicationId, url, userProfile) => {
  const os = require('os');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `puppeteer-profile-${applicationId}-`));
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    if (url.includes('greenhouse.io')) {
      await solveGreenhouse(page, userProfile);
    } else if (url.includes('lever.co')) {
      if (!url.endsWith('/apply') && await page.$('a.postings-btn')) {
         await page.click('a.postings-btn');
         await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
      await solveLever(page, userProfile);
    } else {
      // Use Universal Form Solver for everything else
      await solveUniversalForm(page, userProfile);
    }

    // Capture Proof
    const screenshotName = `proof-${applicationId}-${Date.now()}.webp`;
    const screenshotPath = `public/screenshots/${screenshotName}`;
    const absolutePath = path.join(process.cwd(), screenshotPath);
    
    if (!fs.existsSync(path.dirname(absolutePath))) {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    }

    await page.screenshot({ path: absolutePath, fullPage: true });
    console.log(`Proof captured: ${screenshotPath}`);

    return { 
      success: true, 
      message: 'Universal Form Solved via AI 2.0 and proof captured.',
      screenshot: `/screenshots/${screenshotName}` 
    };
  } catch (error) {
    console.error(`Automation error for ${url}:`, error.message);
    return { success: false, message: error.message };
  } finally {
    if (browser) await browser.close();
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.warn('Temporary profile cleanup failed:', cleanupErr.message);
    }
  }
};

module.exports = { automateApplication };
