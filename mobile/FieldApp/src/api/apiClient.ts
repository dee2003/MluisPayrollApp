// /src/api/apiClient.ts
import axios from 'axios';

// Use the ngrok URL you provided to connect the app to your local backend
const API_BASE_URL = 'https://2d4229bd1d65.ngrok-free.app'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
