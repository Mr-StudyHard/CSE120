/**
 * Helper Functions
 * 
 * Utility functions used throughout the app:
 * - getTypeColor: Maps file type strings to Tailwind CSS color classes
 * - copyToClipboard: Copies text to device clipboard with visual feedback
 */
export const getTypeColor = (color: string) => {
  switch (color) {
    case "button-border-color":
      return "bg-button-outline";
    case "green":
      return "bg-green-500";
    case "orange":
      return "bg-orange-500";
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    default:
      return "bg-black";
  }
};

export const copyToClipboard = (url: string, setCopyPressed: (pressed: boolean) => void) => {
  setCopyPressed(true);
  try {
    const { Clipboard, Alert } = require('react-native');
    Clipboard.setString(url);
    Alert.alert('Success', 'Link copied to clipboard!');
  } catch (err) {
    const { Alert } = require('react-native');
    Alert.alert('Error', 'Failed to copy link to clipboard');
    console.error('Failed to copy to clipboard:', err);
  }
  // Reset the pressed state after a short delay
  setTimeout(() => setCopyPressed(false), 200);
};
