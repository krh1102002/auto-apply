const QUESTIONS = {
  WHY_US: [
    "I am deeply impressed by your company's commitment to innovation and its impact on the industry. My skills in full-stack development align perfectly with your technical vision.",
    "Your company's culture of excellence and the challenging projects you undertake are exactly what I'm looking for in my next career step.",
    "As a dedicated software engineer, I've followed your growth for some time. I'm excited by the prospect of contributing to your team's success."
  ],
  STRENGTHS: [
    "My primary strengths are quick learning, strong problem-solving skills, and a collaborative approach to complex technical challenges.",
    "I excel at bridging the gap between front-end aesthetics and robust back-end logic, ensuring a seamless user experience.",
    "I am highly adaptable and thrive in fast-paced environments where continuous learning is encouraged."
  ]
};

const generateAnswer = (questionText) => {
  const text = questionText.toLowerCase();
  
  if (text.includes('why') || text.includes('interest')) {
    return QUESTIONS.WHY_US[Math.floor(Math.random() * QUESTIONS.WHY_US.length)];
  }
  
  if (text.includes('strength') || text.includes('skill')) {
    return QUESTIONS.STRENGTHS[Math.floor(Math.random() * QUESTIONS.STRENGTHS.length)];
  }

  // Default professional filler
  return "I am a passionate software engineer with a strong foundation in modern web technologies, eager to contribute my technical skills and collaborative spirit to your innovative team.";
};

module.exports = { generateAnswer };
