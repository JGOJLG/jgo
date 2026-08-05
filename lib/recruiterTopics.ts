export const recruiterTopics = [
  {
    title: "How to answer salary expectation questions",
    prompt:
      "Talk about why candidates should give a realistic target instead of an extremely wide salary range.",
  },
  {
    title: "Why your resume needs measurable results",
    prompt:
      "Explain how accomplishments are stronger than a list of responsibilities.",
  },
  {
    title: "The best way to follow up after an interview",
    prompt:
      "Share what to say, when to send it, and how to avoid sounding pushy.",
  },
  {
    title: "How to explain a career gap",
    prompt:
      "Give candidates a confident and honest framework for discussing time away from work.",
  },
  {
    title: "Why recruiters ask about other interviews",
    prompt:
      "Explain what recruiters are really trying to understand and how candidates should respond.",
  },
  {
    title: "How to prepare for a recruiter screen",
    prompt:
      "Cover the information candidates should know before a first conversation.",
  },
  {
    title: "When a candidate should negotiate",
    prompt:
      "Discuss timing, leverage, and how to negotiate without damaging the relationship.",
  },
  {
    title: "Why one resume should not be used for every role",
    prompt:
      "Explain how tailoring improves relevance without rewriting everything.",
  },
  {
    title: "How to talk about being laid off",
    prompt:
      "Help candidates separate a business decision from their professional value.",
  },
  {
    title: "What makes a strong LinkedIn headline",
    prompt:
      "Share a simple formula candidates can use to make their profile easier to understand.",
  },
  {
    title: "How to answer: Tell me about yourself",
    prompt:
      "Teach a concise present, past, and future structure for interviews.",
  },
  {
    title: "Why job titles do not always tell the full story",
    prompt:
      "Discuss transferable skills and how candidates can position work beyond their official title.",
  },
  {
    title: "What to do when a company ghosts you",
    prompt:
      "Give a practical follow-up timeline and explain when it is time to move on.",
  },
  {
    title: "How to research a company before an interview",
    prompt:
      "Share the most useful places to look and what information actually matters.",
  },
  {
    title: "The difference between confidence and overselling",
    prompt:
      "Help candidates describe their value honestly without minimizing themselves.",
  },
  {
    title: "Why interview examples need a clear result",
    prompt:
      "Explain how to finish STAR stories with a measurable or meaningful outcome.",
  },
  {
    title: "How to decide whether a role is worth pursuing",
    prompt:
      "Discuss compensation, growth, manager quality, workload, and long-term fit.",
  },
  {
    title: "What recruiters notice in the first resume scan",
    prompt:
      "Explain the importance of clarity, relevance, recent experience, and clean formatting.",
  },
  {
    title: "How to ask better questions in an interview",
    prompt:
      "Give candidates questions that uncover expectations, team culture, and success measures.",
  },
  {
    title: "Why being open to feedback matters in a job search",
    prompt:
      "Discuss how small changes in positioning can improve results.",
  },
  {
    title: "How to explain why you are leaving your job",
    prompt:
      "Offer positive language that focuses on growth instead of complaints.",
  },
  {
    title: "When certifications help and when they do not",
    prompt:
      "Explain how credentials should support experience rather than replace it.",
  },
  {
    title: "Why candidates should track their applications",
    prompt:
      "Share a simple system for organizing roles, contacts, interviews, and follow-ups.",
  },
  {
    title: "How to handle a lower-than-expected offer",
    prompt:
      "Discuss evaluating the full package and responding professionally.",
  },
  {
    title: "What to include in a strong professional summary",
    prompt:
      "Explain how to lead with target role, experience, strengths, and value.",
  },
  {
    title: "How to prepare examples before an interview",
    prompt:
      "Encourage candidates to prepare stories about challenges, leadership, conflict, and results.",
  },
  {
    title: "Why networking should not feel transactional",
    prompt:
      "Share ways to build real professional relationships before asking for help.",
  },
  {
    title: "How to know when your resume is too long",
    prompt:
      "Discuss relevance, career level, repetition, and recruiter readability.",
  },
  {
    title: "What to do after a rejection",
    prompt:
      "Help candidates process the outcome, request useful feedback, and keep momentum.",
  },
  {
    title: "How to discuss remote or hybrid preferences",
    prompt:
      "Show candidates how to be clear without closing doors too early.",
  },
  {
    title: "Why clarity beats cleverness in a job search",
    prompt:
      "Explain why resumes, LinkedIn profiles, and interview answers should be easy to understand.",
  },
];

export function getRecruiterTopicForDate(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86_400_000
  );

  return recruiterTopics[dayOfYear % recruiterTopics.length];
}

export function getRecruiterTopicOfTheDay() {
  return getRecruiterTopicForDate(new Date());
}
