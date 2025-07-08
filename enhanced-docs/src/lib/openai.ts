const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function enhanceText(text: string, action: string): Promise<string> {
  const prompts = {
    improve: `Improve the following text while maintaining its original meaning and style. Make it more clear, engaging, and well-written:\n\n${text}`,
    summarize: `Summarize the following text concisely while preserving the key points:\n\n${text}`,
    expand: `Expand the following text with more details, examples, and context while maintaining the original tone:\n\n${text}`,
    simplify: `Simplify the following text to make it easier to understand while keeping the main message:\n\n${text}`,
    correct: `Correct any grammar, spelling, or punctuation errors in the following text:\n\n${text}`,
  };

  const prompt = prompts[action as keyof typeof prompts] || prompts.improve;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful writing assistant. Provide only the enhanced text without any additional commentary or formatting unless specifically requested.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('Error enhancing text:', error);
    throw new Error('Failed to enhance text');
  }
}

export async function generateText(prompt: string, context?: string): Promise<string> {
  const fullPrompt = context 
    ? `Context: ${context}\n\nPrompt: ${prompt}`
    : prompt;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful writing assistant. Generate high-quality, relevant content based on the user\'s prompt. Provide only the generated text without additional commentary.',
          },
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Failed to generate text');
  }
}
