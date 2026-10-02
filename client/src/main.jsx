import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store.js'
import axios from 'axios'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Global Axios Interceptor to attach the token to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  // Only attach our app's JWT token if the request is NOT going to Google's API
  if (token && !config.url.includes("googleapis.com")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
    </BrowserRouter>
  </StrictMode>,
)
