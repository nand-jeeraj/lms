import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL;
console.log(process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || BASE_URL,  
  withCredentials: true                  
});

export default api;