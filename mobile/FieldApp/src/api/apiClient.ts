// /src/api/apiClient.ts
import axios from 'axios';

// Use the ngrok URL you provided to connect the app to your local backend
const API_BASE_URL = 'https://5b785fe4e786.ngrok-free.app'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
