/**
 * Converts a File object to a Base64 string suitable for Gemini API.
 * Strips the data URL prefix (e.g., "data:application/pdf;base64,").
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix to get raw base64
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generates a unique ID for list keys.
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};