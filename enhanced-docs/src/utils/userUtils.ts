// Centralized user ID management
export const getUserId = (): string => {
  if (typeof window === 'undefined') {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }
  
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
};

export const generateNewUserId = (): string => {
  const userId = 'user_' + Math.random().toString(36).substr(2, 9);
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
  }
  return userId;
};

export const clearUserId = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId');
  }
};