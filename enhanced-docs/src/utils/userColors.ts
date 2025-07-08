// Generate consistent colors for users based on their ID
export const getUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Light Yellow
    '#BB8FCE', // Light Purple
    '#85C1E9', // Light Blue
    '#F8C471', // Orange
    '#82E0AA', // Light Green
  ];

  // Create a simple hash from the userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use the hash to select a color
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Generate a darker version of the color for borders
export const getDarkerColor = (color: string): string => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Darken by 20%
  const darkerR = Math.floor(r * 0.8);
  const darkerG = Math.floor(g * 0.8);
  const darkerB = Math.floor(b * 0.8);

  // Convert back to hex
  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};

// Get a light version of the color for backgrounds
export const getLighterColor = (color: string): string => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Lighten by mixing with white
  const lighterR = Math.floor(r + (255 - r) * 0.8);
  const lighterG = Math.floor(g + (255 - g) * 0.8);
  const lighterB = Math.floor(b + (255 - b) * 0.8);

  // Convert back to hex
  return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
};