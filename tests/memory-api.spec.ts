import { test, expect } from '@playwright/test';

// Test the memory integration by directly calling the API endpoints
test.describe('Memory API Integration Tests', () => {
  test('Test memory storage and retrieval via API', async ({ request }) => {
    // Test the plan endpoint directly
    const response = await request.post('http://localhost:8081/api/plan', {
      data: {
        role: 'founder',
        history: [
          { id: 'sys', role: 'system', content: 'You are QuickHand, an execution-focused ops assistant for startup founders.' },
          { id: 'user1', role: 'user', content: 'I need help with startup funding strategies' },
          { id: 'assistant1', role: 'assistant', content: 'Here are some key startup funding strategies: bootstrapping, angel investors, venture capital, and crowdfunding.' }
        ]
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock auth token
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('content');
    console.log('API Response:', data);
  });

  test('Test memory with different roles', async ({ request }) => {
    // Test with student role
    const studentResponse = await request.post('http://localhost:8081/api/plan', {
      data: {
        role: 'student',
        history: [
          { id: 'sys', role: 'system', content: 'You are QuickHand, a study companion.' },
          { id: 'user1', role: 'user', content: 'Help me understand photosynthesis' },
          { id: 'assistant1', role: 'assistant', content: 'Photosynthesis is the process by which plants convert light energy into chemical energy.' }
        ]
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    expect(studentResponse.status()).toBe(200);
    const studentData = await studentResponse.json();
    expect(studentData).toHaveProperty('content');
    console.log('Student API Response:', studentData);
  });

  test('Test memory persistence across requests', async ({ request }) => {
    // First request - store memory
    const firstResponse = await request.post('http://localhost:8081/api/plan', {
      data: {
        role: 'founder',
        history: [
          { id: 'sys', role: 'system', content: 'You are QuickHand, an execution-focused ops assistant for startup founders.' },
          { id: 'user1', role: 'user', content: 'I need help with startup funding strategies' },
          { id: 'assistant1', role: 'assistant', content: 'Here are some key startup funding strategies: bootstrapping, angel investors, venture capital, and crowdfunding.' }
        ]
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    expect(firstResponse.status()).toBe(200);
    console.log('First request completed');

    // Second request - should reference previous memory
    const secondResponse = await request.post('http://localhost:8081/api/plan', {
      data: {
        role: 'founder',
        history: [
          { id: 'sys', role: 'system', content: 'You are QuickHand, an execution-focused ops assistant for startup founders.' },
          { id: 'user1', role: 'user', content: 'I need help with startup funding strategies' },
          { id: 'assistant1', role: 'assistant', content: 'Here are some key startup funding strategies: bootstrapping, angel investors, venture capital, and crowdfunding.' },
          { id: 'user2', role: 'user', content: 'Tell me more about that funding advice' }
        ]
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    expect(secondResponse.status()).toBe(200);
    const secondData = await secondResponse.json();
    expect(secondData).toHaveProperty('content');
    console.log('Second request response:', secondData.content);
    
    // The response should reference the previous funding discussion
    expect(secondData.content.toLowerCase()).toContain('funding');
  });

  test('Test role isolation in memory', async ({ request }) => {
    // First, create a memory as founder
    const founderResponse = await request.post('http://localhost:8081/api/plan', {
      data: {
        role: 'founder',
        history: [
          { id: 'sys', role: 'system', content: 'You are QuickHand, an execution-focused ops assistant for startup founders.' },
          { id: 'user1', role: 'user', content: 'I need help with startup funding strategies' },
          { id: 'assistant1', role: 'assistant', content: 'Here are some key startup funding strategies: bootstrapping, angel investors, venture capital, and crowdfunding.' }
        ]
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    expect(founderResponse.status()).toBe(200);
    console.log('Founder memory stored');

    // Then, test as student - should not reference founder context
    const studentResponse = await request.post('http://localhost:8081/api/plan', {
      data: {
        role: 'student',
        history: [
          { id: 'sys', role: 'system', content: 'You are QuickHand, a study companion.' },
          { id: 'user1', role: 'user', content: 'What about funding?' }
        ]
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    expect(studentResponse.status()).toBe(200);
    const studentData = await studentResponse.json();
    console.log('Student response:', studentData.content);
    
    // Student response should not contain startup-specific terms
    const content = studentData.content.toLowerCase();
    expect(content).not.toContain('startup');
    expect(content).not.toContain('venture capital');
    expect(content).not.toContain('angel investors');
  });

  test('Test memory with action suggestions', async ({ request }) => {
    const response = await request.post('http://localhost:8081/api/plan', {
      data: {
        role: 'creator',
        history: [
          { id: 'sys', role: 'system', content: 'You are QuickHand, a content repurposer.' },
          { id: 'user1', role: 'user', content: 'Research electric vehicles for a video script' },
          { id: 'assistant1', role: 'assistant', content: 'Electric vehicles are revolutionizing transportation with their zero-emission technology and advanced battery systems.' }
        ]
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('plan');
    
    // Should suggest Notion action
    if (data.plan && data.plan.length > 0) {
      const notionAction = data.plan.find((action: any) => action.action === 'notion');
      expect(notionAction).toBeDefined();
      console.log('Notion action suggested:', notionAction);
    }
    
    console.log('Response with actions:', data);
  });
});
