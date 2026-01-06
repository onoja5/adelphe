import axios from 'axios';
import { Platform } from 'react-native';

// For web production (Vercel), use relative URLs to leverage rewrites
// For development and native, use the full backend URL
const getBaseUrl = () => {
  // Check if we're in a web browser in production
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // In production on Vercel, use relative URL (rewrites handle it)
    if (window.location.hostname !== 'localhost') {
      return '/api';
    }
  }
  
  // For development or native apps, use the full URL
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  return `${backendUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
