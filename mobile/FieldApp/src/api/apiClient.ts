// /src/api/apiClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Use the ngrok URL you provided to connect the app to your local backend

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
