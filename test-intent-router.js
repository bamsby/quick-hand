// Test script for Intent Router accuracy
// Run with: node test-intent-router.js

const testCases = [
  // info_lookup cases
  { query: "What are the best hackathons in 2025?", expectedIntent: "info_lookup", expectedTopic: "hackathons 2025" },
  { query: "Tell me about React hooks", expectedIntent: "info_lookup", expectedTopic: "React hooks" },
  { query: "What's the weather like?", expectedIntent: "info_lookup", expectedTopic: "weather", needsLocation: true },
  { query: "How much does a Tesla cost?", expectedIntent: "info_lookup", expectedTopic: "Tesla cost" },
  
  // chitchat cases
  { query: "Hello!", expectedIntent: "chitchat", expectedTopic: "" },
  { query: "Hi there!", expectedIntent: "chitchat", expectedTopic: "" },
  { query: "How are you?", expectedIntent: "chitchat", expectedTopic: "" },
  
  // email_draft cases
  { query: "Draft an email to my team about the project update", expectedIntent: "email_draft", expectedTopic: "project update", needsEmail: true },
  { query: "Send an email to John about the meeting", expectedIntent: "email_draft", expectedTopic: "meeting", needsEmail: true },
  { query: "Write an email to the client", expectedIntent: "email_draft", expectedTopic: "client communication", needsEmail: true },
  
  // action_request cases
  { query: "Save this to Notion", expectedIntent: "action_request", expectedTopic: "save to notion" },
  { query: "Create a Notion page", expectedIntent: "action_request", expectedTopic: "notion page" },
  { query: "Save to my workspace", expectedIntent: "action_request", expectedTopic: "save to workspace" },
  
  // summarize cases
  { query: "Can you summarize the key points?", expectedIntent: "summarize", expectedTopic: "key points" },
  { query: "Summarize this article", expectedIntent: "summarize", expectedTopic: "article" },
  { query: "Give me a summary", expectedIntent: "summarize", expectedTopic: "summary" },
];

console.log("Intent Router Test Cases");
console.log("====================");
console.log(`Total test cases: ${testCases.length}`);
console.log("");

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. Query: "${testCase.query}"`);
  console.log(`   Expected: ${testCase.expectedIntent} | Topic: "${testCase.expectedTopic}"`);
  if (testCase.needsLocation) console.log(`   Needs Location: true`);
  if (testCase.needsEmail) console.log(`   Needs Email: true`);
  console.log("");
});

console.log("Expected Results:");
console.log("- 95%+ accuracy on intent classification");
console.log("- Topic extraction for non-chitchat intents");
console.log("- Location detection for weather/local queries");
console.log("- Email detection for email drafting requests");
console.log("");
console.log("To test manually:");
console.log("1. Deploy the classify-intent Edge Function");
console.log("2. Set GEMINI_API_KEY in Supabase Edge Functions secrets");
console.log("3. Test each query through the chat interface");
console.log("4. Check Edge Function logs for intent classifications");
