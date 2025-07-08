import { describe, it, expect } from '@jest/globals';
import { documentService } from '@/lib/documents';
import { enhanceText, generateText } from '@/lib/openai';

describe('Document Service', () => {
  it('should get all documents', () => {
    const documents = documentService.getAll();
    expect(Array.isArray(documents)).toBe(true);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0]).toHaveProperty('id');
    expect(documents[0]).toHaveProperty('title');
    expect(documents[0]).toHaveProperty('content');
    expect(documents[0]).toHaveProperty('createdAt');
    expect(documents[0]).toHaveProperty('updatedAt');
  });

  it('should create a new document', () => {
    const title = 'Test Document';
    const content = '<p>Test content</p>';
    
    const document = documentService.create(title, content);
    
    expect(document).toHaveProperty('id');
    expect(document.title).toBe(title);
    expect(document.content).toBe(content);
    expect(document).toHaveProperty('createdAt');
    expect(document).toHaveProperty('updatedAt');
  });

  it('should get a specific document', () => {
    const uniqueTitle = `Test Doc ${Date.now()}`;
    const document = documentService.create(uniqueTitle, 'Test content');
    const retrieved = documentService.getById(document.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(document.id);
    expect(retrieved?.title).toBe(uniqueTitle);
  });

  it('should return undefined for non-existent document', () => {
    const document = documentService.getById('non-existent-id');
    expect(document).toBeUndefined();
  });

  it('should update a document', async () => {
    const document = documentService.create('Original Title', 'Original content');
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updates = {
      title: 'Updated Title',
      content: 'Updated content'
    };

    const updated = documentService.update(document.id, updates);
    
    expect(updated).toBeDefined();
    expect(updated?.title).toBe(updates.title);
    expect(updated?.content).toBe(updates.content);
    expect(updated?.updatedAt).not.toBe(document.updatedAt);
  });

  it('should delete a document', () => {
    const document = documentService.create('To Delete', 'Delete me');
    
    const deleted = documentService.delete(document.id);
    expect(deleted).toBe(true);
    
    const retrieved = documentService.getById(document.id);
    expect(retrieved).toBeUndefined();
  });

  it('should return false when deleting non-existent document', () => {
    const deleted = documentService.delete('non-existent-id');
    expect(deleted).toBe(false);
  });
});

describe('AI Service', () => {
  it('should enhance text', async () => {
    const text = 'This is a test text.';
    const action = 'improve';

    const enhancedText = await enhanceText(text, action);
    
    expect(typeof enhancedText).toBe('string');
    expect(enhancedText.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for AI calls

  it('should generate text', async () => {
    const prompt = 'Write a short paragraph about technology.';
    const context = 'This is for a blog post';

    const generatedText = await generateText(prompt, context);
    
    expect(typeof generatedText).toBe('string');
    expect(generatedText.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for AI calls
});