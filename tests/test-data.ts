// Test data for memory integration tests

export const TEST_CONVERSATIONS = {
  founder: {
    initial: "I need help with startup funding strategies",
    followUp: "Tell me more about that funding advice",
    expectedKeywords: ["funding", "startup", "investment", "capital"]
  },
  student: {
    initial: "What about funding?",
    expectedKeywords: ["funding"],
    shouldNotContain: ["startup", "business", "investment"]
  },
  creator: {
    initial: "Research electric vehicles for a video script",
    followUp: "Save that research to my Notion",
    expectedKeywords: ["electric", "vehicle", "video", "script"]
  },
  teacher: {
    initial: "Create a lesson plan about renewable energy",
    followUp: "Save this lesson plan to Notion",
    expectedKeywords: ["lesson", "renewable", "energy", "plan"]
  },
  productManager: {
    initial: "I need to analyze user feedback about our mobile app",
    followUp: "What about the performance issues mentioned?",
    expectedKeywords: ["feedback", "mobile", "app", "performance"]
  },
  propertyAgent: {
    initial: "Research the latest real estate market trends in San Francisco",
    followUp: "Draft an email to my client about these trends",
    expectedKeywords: ["San Francisco", "market", "trends", "real estate"]
  },
  general: {
    initial: "Tell me about artificial intelligence",
    followUp: "What are the main applications?",
    expectedKeywords: ["artificial intelligence", "AI", "applications"]
  }
};

export const TEST_EDGE_CASES = {
  shortMessages: [
    "Video ideas?",
    "TikTok", 
    "Make it viral"
  ],
  longConversation: [
    "I need to create a comprehensive product roadmap for our SaaS platform",
    "Focus on user authentication features first",
    "Then add payment processing",
    "Finally implement analytics dashboard"
  ],
  roleSwitching: {
    teacher: "Create a math lesson about fractions",
    founder: "What about fractions?"
  }
};

export const TEST_ACTIONS = {
  notion: {
    trigger: "Save this to Notion",
    expectedButton: "Save to Notion",
    expectedContent: ["content", "information"]
  },
  email: {
    trigger: "Draft an email about this",
    expectedButton: "Draft Email", 
    expectedContent: ["email", "draft"]
  }
};

export const MEMORY_TEST_SCENARIOS = {
  roleIsolation: {
    description: "Test that different roles have separate memories",
    steps: [
      "Start conversation in Role A",
      "Switch to Role B", 
      "Verify Role B doesn't reference Role A context",
      "Switch back to Role A",
      "Verify Role A remembers its context"
    ]
  },
  crossSession: {
    description: "Test that memories persist across browser sessions",
    steps: [
      "Have conversation in session 1",
      "Close browser",
      "Open new session",
      "Verify previous conversation is remembered"
    ]
  },
  memoryRelevance: {
    description: "Test that assistant references previous conversations naturally",
    steps: [
      "Start topic A conversation",
      "Ask follow-up about topic A",
      "Verify response references topic A context"
    ]
  }
};

export const ERROR_SCENARIOS = {
  memoryFailure: {
    description: "Test graceful degradation when memory service fails",
    simulation: "Intercept mem0 API calls and return 500 error",
    expectedBehavior: "App continues working without memory"
  },
  networkTimeout: {
    description: "Test behavior when memory API is slow",
    simulation: "Add delay to memory API responses",
    expectedBehavior: "App should timeout gracefully and continue"
  }
};

// Helper function to generate test messages
export function generateTestMessage(role: string, context: string): string {
  const templates = {
    founder: `As a startup founder, I need help with ${context}`,
    student: `I'm a student studying ${context}`,
    creator: `I'm a content creator working on ${context}`,
    teacher: `I'm a teacher creating a lesson about ${context}`,
    productManager: `I'm a product manager analyzing ${context}`,
    propertyAgent: `I'm a real estate agent researching ${context}`,
    general: `I need information about ${context}`
  };
  
  return templates[role as keyof typeof templates] || `Help me with ${context}`;
}

// Helper function to generate follow-up messages
export function generateFollowUpMessage(previousContext: string): string {
  const followUps = [
    `Tell me more about ${previousContext}`,
    `What about ${previousContext}?`,
    `Can you explain more about that ${previousContext}?`,
    `Save this ${previousContext} to my Notion`,
    `Draft an email about ${previousContext}`
  ];
  
  return followUps[Math.floor(Math.random() * followUps.length)];
}
