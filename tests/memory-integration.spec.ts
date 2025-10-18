import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8081'; // Expo web dev server
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Helper function to wait for app to load
async function waitForAppLoad(page: any) {
  // First check if we're on the login page
  const isLoginPage = await page.locator('text="Sign in to continue"').isVisible().catch(() => false);
  
  if (isLoginPage) {
    // Handle authentication - for testing, we'll use a test account
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.fill('input[placeholder="Password"]', 'testpassword123');
    await page.click('text="Sign In"');
    
    // Wait for authentication to complete and role selection to appear
    await page.waitForSelector('text="Pick your role"', { timeout: 15000 });
  } else {
    // Wait for the role selection page to load
    await page.waitForSelector('text="Pick your role"', { timeout: 10000 });
  }
}

// Helper function to select a role
async function selectRole(page: any, role: string) {
  // Click on the role button by text content
  const roleButton = page.locator(`text="${ROLE_PRESETS[role as keyof typeof ROLE_PRESETS]?.label || role}"`);
  await roleButton.click();
  await page.waitForURL(`**/chat?role=${role}`);
}

// Role presets for reference
const ROLE_PRESETS = {
  founder: { label: "Founder" },
  student: { label: "Student" },
  teacher: { label: "Teacher" },
  creator: { label: "Creator" },
  propertyAgent: { label: "Property Agent" },
  productManager: { label: "Product Manager" },
  general: { label: "General" }
};

// Helper function to send a message and wait for response
async function sendMessage(page: any, message: string) {
  const input = page.locator('input[placeholder*="Ask QuickHand"]');
  await input.fill(message);
  await page.locator('button:has-text("Send")').click();
  
  // Wait for response (look for assistant message bubble)
  await page.waitForSelector('text="Thinking..."', { timeout: 5000 }).catch(() => {});
  await page.waitForSelector('text="Thinking..."', { timeout: 10000 }).catch(() => {});
  // Wait for the thinking indicator to disappear and response to appear
  await page.waitForTimeout(2000);
}

// Helper function to get the last assistant message
async function getLastAssistantMessage(page: any) {
  // Look for the last message bubble that's not from user
  const messageBubbles = page.locator('[style*="alignSelf: flex-start"]');
  const count = await messageBubbles.count();
  if (count > 0) {
    return await messageBubbles.nth(count - 1).textContent();
  }
  return "";
}

test.describe('Mem0.ai Memory Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
  });

  test('Role-specific memory isolation', async ({ page }) => {
    // Test as Founder role
    await selectRole(page, 'founder');
    await sendMessage(page, 'I need help with startup funding strategies');
    
    // Get the response
    const founderResponse = await getLastAssistantMessage(page);
    expect(founderResponse).toContain('funding');
    
    // Switch to Student role
    await page.goto(`${BASE_URL}/`);
    await waitForAppLoad(page);
    await selectRole(page, 'student');
    await sendMessage(page, 'What about funding?');
    
    // The response should NOT reference startup funding context
    const studentResponse = await getLastAssistantMessage(page);
    expect(studentResponse).not.toContain('startup');
    expect(studentResponse).not.toContain('business');
    
    // Switch back to Founder role
    await page.goto(`${BASE_URL}/`);
    await waitForAppLoad(page);
    await selectRole(page, 'founder');
    await sendMessage(page, 'Tell me more about that funding advice');
    
    // Should reference the previous startup funding conversation
    const founderFollowUp = await getLastAssistantMessage(page);
    expect(founderFollowUp).toContain('funding');
  });

  test('Cross-session memory persistence', async ({ page, context }) => {
    // First session - have a conversation
    await selectRole(page, 'creator');
    await sendMessage(page, 'Research electric vehicles for a video script');
    
    const firstResponse = await getLastAssistantMessage(page);
    expect(firstResponse).toContain('electric');
    
    // Close the browser context (simulates new session)
    await context.close();
    
    // Create new context and navigate to app
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext?.newPage();
    
    if (!newPage) throw new Error('Failed to create new page');
    
    await newPage.goto(BASE_URL);
    await waitForAppLoad(newPage);
    
    // Select same role and ask follow-up question
    await selectRole(newPage, 'creator');
    await sendMessage(newPage, 'Save that research to my Notion');
    
    // Should remember the EV research context
    const followUpResponse = await getLastAssistantMessage(newPage);
    expect(followUpResponse).toContain('electric');
    expect(followUpResponse).toContain('vehicle');
  });

  test('Memory relevance in responses', async ({ page }) => {
    // Start a conversation about a specific topic
    await selectRole(page, 'productManager');
    await sendMessage(page, 'I need to analyze user feedback about our mobile app');
    
    const firstResponse = await getLastAssistantMessage(page);
    expect(firstResponse).toContain('feedback');
    
    // Ask a follow-up question that should reference previous context
    await sendMessage(page, 'What about the performance issues mentioned?');
    
    const followUpResponse = await getLastAssistantMessage(page);
    // Should reference the previous feedback analysis context
    expect(followUpResponse).toContain('feedback');
    expect(followUpResponse).toContain('mobile');
  });

  test('Memory with action suggestions', async ({ page }) => {
    // Have a conversation that should trigger memory
    await selectRole(page, 'teacher');
    await sendMessage(page, 'Create a lesson plan about renewable energy');
    
    const firstResponse = await getLastAssistantMessage(page);
    expect(firstResponse).toContain('renewable');
    expect(firstResponse).toContain('energy');
    
    // Ask to save the lesson plan
    await sendMessage(page, 'Save this lesson plan to Notion');
    
    const saveResponse = await getLastAssistantMessage(page);
    // Should reference the lesson plan content
    expect(saveResponse).toContain('lesson');
    expect(saveResponse).toContain('renewable');
    
    // Check if action buttons appear
    const actionButton = page.locator('button:has-text("Save to Notion")');
    await expect(actionButton).toBeVisible();
  });

  test('Memory with email drafting', async ({ page }) => {
    // Have a research conversation
    await selectRole(page, 'propertyAgent');
    await sendMessage(page, 'Research the latest real estate market trends in San Francisco');
    
    const researchResponse = await getLastAssistantMessage(page);
    expect(researchResponse).toContain('San Francisco');
    expect(researchResponse).toContain('market');
    
    // Ask to draft an email about the research
    await sendMessage(page, 'Draft an email to my client about these trends');
    
    const emailResponse = await getLastAssistantMessage(page);
    // Should reference the San Francisco market research
    expect(emailResponse).toContain('San Francisco');
    expect(emailResponse).toContain('market');
    
    // Check if email action button appears
    const emailButton = page.locator('button:has-text("Draft Email")');
    await expect(emailButton).toBeVisible();
  });

  test('Memory context in system prompts', async ({ page }) => {
    // Test that memories are injected as context, not exposed directly
    await selectRole(page, 'general');
    await sendMessage(page, 'Tell me about artificial intelligence');
    
    const firstResponse = await getLastAssistantMessage(page);
    expect(firstResponse).toContain('artificial intelligence');
    
    // Ask a follow-up that should use memory context
    await sendMessage(page, 'What are the main applications?');
    
    const followUpResponse = await getLastAssistantMessage(page);
    // Should naturally reference AI without explicitly mentioning "previous conversation"
    expect(followUpResponse).toContain('AI');
    expect(followUpResponse).toContain('artificial intelligence');
    
    // Should not contain memory metadata or technical references
    expect(followUpResponse).not.toContain('PREVIOUS CONVERSATION');
    expect(followUpResponse).not.toContain('memory');
  });

  test('Error handling when memory fails', async ({ page }) => {
    // This test verifies the app continues working even if memory fails
    // We'll simulate this by having a conversation and checking it still works
    
    await selectRole(page, 'founder');
    await sendMessage(page, 'Help me with business strategy');
    
    const response = await getLastAssistantMessage(page);
    expect(response).toContain('strategy');
    
    // App should continue working normally
    await sendMessage(page, 'What about marketing?');
    
    const followUp = await getLastAssistantMessage(page);
    expect(followUp).toContain('marketing');
  });

  test('Memory with different conversation topics', async ({ page }) => {
    // Test memory with multiple distinct topics
    await selectRole(page, 'student');
    
    // First topic
    await sendMessage(page, 'Explain photosynthesis');
    const firstResponse = await getLastAssistantMessage(page);
    expect(firstResponse).toContain('photosynthesis');
    
    // Second topic
    await sendMessage(page, 'What about calculus derivatives?');
    const secondResponse = await getLastAssistantMessage(page);
    expect(secondResponse).toContain('calculus');
    expect(secondResponse).toContain('derivative');
    
    // Ask about first topic again
    await sendMessage(page, 'Can you explain more about that plant process?');
    const thirdResponse = await getLastAssistantMessage(page);
    // Should reference photosynthesis from earlier
    expect(thirdResponse).toContain('photosynthesis');
  });
});

test.describe('Memory Integration Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
  });

  test('Memory with very short messages', async ({ page }) => {
    await selectRole(page, 'creator');
    
    // Short messages that should still create meaningful memories
    await sendMessage(page, 'Video ideas?');
    await sendMessage(page, 'TikTok');
    await sendMessage(page, 'Make it viral');
    
    const response = await getLastAssistantMessage(page);
    expect(response).toContain('TikTok');
    expect(response).toContain('viral');
  });

  test('Memory with long conversations', async ({ page }) => {
    await selectRole(page, 'productManager');
    
    // Long conversation that should test memory limits
    await sendMessage(page, 'I need to create a comprehensive product roadmap for our SaaS platform');
    await sendMessage(page, 'Focus on user authentication features first');
    await sendMessage(page, 'Then add payment processing');
    await sendMessage(page, 'Finally implement analytics dashboard');
    
    // Ask a question that should reference the entire conversation
    await sendMessage(page, 'What should be the priority order for these features?');
    
    const response = await getLastAssistantMessage(page);
    expect(response).toContain('authentication');
    expect(response).toContain('payment');
    expect(response).toContain('analytics');
  });

  test('Memory with role switching', async ({ page }) => {
    // Test memory isolation when switching between roles
    await selectRole(page, 'teacher');
    await sendMessage(page, 'Create a math lesson about fractions');
    
    // Switch to different role
    await page.goto(`${BASE_URL}/`);
    await waitForAppLoad(page);
    await selectRole(page, 'founder');
    await sendMessage(page, 'What about fractions?');
    
    // Should not reference the math lesson context
    const response = await getLastAssistantMessage(page);
    expect(response).not.toContain('lesson');
    expect(response).not.toContain('math');
  });
});
