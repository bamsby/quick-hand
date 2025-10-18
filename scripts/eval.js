#!/usr/bin/env node

/**
 * Simple evaluation script for QuickHand edge functions
 * Tests JSON validity, citation presence, word-count bounds, and latency
 */

const testCases = [
  {
    name: "Basic info lookup",
    query: "What are the benefits of remote work?",
    role: "general",
    expectedFields: ["answer", "bullets", "citations", "followups"],
    minWords: 50,
    maxWords: 500
  },
  {
    name: "Email draft request",
    query: "Draft an email to my team about the new project timeline",
    role: "productManager",
    expectedFields: ["answer", "bullets", "followups"],
    minWords: 30,
    maxWords: 300
  },
  {
    name: "Notion save request",
    query: "Save this meeting summary to Notion: We discussed Q1 goals and budget allocation",
    role: "founder",
    expectedFields: ["answer", "bullets", "followups"],
    minWords: 20,
    maxWords: 200
  },
  {
    name: "Technical question",
    query: "How does React Server Components work?",
    role: "student",
    expectedFields: ["answer", "bullets", "citations", "followups"],
    minWords: 100,
    maxWords: 600
  },
  {
    name: "Casual conversation",
    query: "How are you doing today?",
    role: "general",
    expectedFields: ["answer"],
    minWords: 10,
    maxWords: 100
  }
];

async function runEvaluation() {
  const results = [];
  const startTime = Date.now();
  
  console.log("🚀 Starting QuickHand Edge Function Evaluation\n");
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    const testStart = Date.now();
    
    try {
      // Mock request to the edge function
      const response = await fetch('http://localhost:54321/functions/v1/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          role: testCase.role,
          history: [
            { id: 'sys', role: 'system', content: 'You are QuickHand, a helpful assistant.' },
            { id: 'user', role: 'user', content: testCase.query }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      const testEnd = Date.now();
      const latency = testEnd - testStart;
      
      // Validate JSON structure
      const hasRequiredFields = testCase.expectedFields.every(field => 
        data.structured && data.structured[field] !== undefined
      );
      
      // Count words in answer
      const wordCount = data.structured?.answer?.split(/\s+/).length || 0;
      const wordCountValid = wordCount >= testCase.minWords && wordCount <= testCase.maxWords;
      
      // Check for citations if expected
      const hasCitations = !testCase.expectedFields.includes('citations') || 
        (data.structured?.citations && data.structured.citations.length > 0);
      
      // Check for inline citations in answer
      const hasInlineCitations = !data.structured?.answer || 
        /\[\d+\]/.test(data.structured.answer);
      
      const result = {
        name: testCase.name,
        passed: hasRequiredFields && wordCountValid && hasCitations && hasInlineCitations,
        latency,
        details: {
          hasRequiredFields,
          wordCountValid: `${wordCount} words (${testCase.minWords}-${testCase.maxWords})`,
          hasCitations,
          hasInlineCitations,
          jsonValid: typeof data === 'object' && data !== null
        }
      };
      
      results.push(result);
      
      if (result.passed) {
        console.log(`✅ PASS - ${latency}ms`);
      } else {
        console.log(`❌ FAIL - ${latency}ms`);
        console.log(`   Issues: ${Object.entries(result.details)
          .filter(([_, value]) => value === false || value === 'false')
          .map(([key, _]) => key)
          .join(', ')}`);
      }
      
    } catch (error) {
      const testEnd = Date.now();
      const latency = testEnd - testStart;
      
      results.push({
        name: testCase.name,
        passed: false,
        latency,
        error: error.message
      });
      
      console.log(`❌ ERROR - ${latency}ms: ${error.message}`);
    }
    
    console.log('');
  }
  
  const totalTime = Date.now() - startTime;
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log("📊 Evaluation Summary");
  console.log("===================");
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Latency: ${Math.round(results.reduce((sum, r) => sum + r.latency, 0) / total)}ms`);
  
  // Detailed results table
  console.log("\n📋 Detailed Results");
  console.log("==================");
  console.log("Test Name".padEnd(30) + "Status".padEnd(8) + "Latency".padEnd(10) + "Details");
  console.log("-".repeat(80));
  
  results.forEach(result => {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    const details = result.error || Object.entries(result.details)
      .filter(([_, value]) => value === false || value === 'false')
      .map(([key, _]) => key)
      .join(', ') || "All checks passed";
    
    console.log(
      result.name.padEnd(30) + 
      status.padEnd(8) + 
      `${result.latency}ms`.padEnd(10) + 
      details
    );
  });
  
  // Exit with error code if any tests failed
  if (passed < total) {
    process.exit(1);
  }
}

// Run evaluation
runEvaluation().catch(error => {
  console.error("Evaluation failed:", error);
  process.exit(1);
});
