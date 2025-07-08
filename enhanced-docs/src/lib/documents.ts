// In-memory document storage (in production, use a database)
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

let documents: Document[] = [
  {
    id: 'doc_1',
    title: 'Welcome to Enhanced Docs',
    content: '<h1>Welcome to Enhanced Docs</h1><p>This is a collaborative document editor with AI features. Try selecting some text to see the AI enhancement options!</p>',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const documentService = {
  getAll: (): Document[] => {
    return documents;
  },

  getById: (id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  },

  create: (title: string, content: string = ''): Document => {
    const newDoc: Document = {
      id: `doc_${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    documents.push(newDoc);
    return newDoc;
  },

  update: (id: string, updates: Partial<Pick<Document, 'title' | 'content'>>): Document | null => {
    const docIndex = documents.findIndex(doc => doc.id === id);
    if (docIndex === -1) return null;

    documents[docIndex] = {
      ...documents[docIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return documents[docIndex];
  },

  delete: (id: string): boolean => {
    const docIndex = documents.findIndex(doc => doc.id === id);
    if (docIndex === -1) return false;

    documents.splice(docIndex, 1);
    return true;
  },
};