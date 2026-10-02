import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import { serverUrl } from '../App';

function OAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash;
        if (!hash) {
          throw new Error('No hash found in URL');
        }

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) {
          throw new Error('No access_token found');
        }

        // Fetch user info from Google
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const name = userInfo.data.name;
        const email = userInfo.data.email;

        const result = await axios.post(serverUrl + '/api/auth/google', { name, email }, {
          withCredentials: true
        });

        localStorage.setItem('token', result.data.token);
        dispatch(setUserData(result.data.user));
        navigate('/', { replace: true });
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        setError('Login failed during callback. Redirecting...');
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black font-semibold flex-col">
      <div className="text-xl mb-4">Completing secure login...</div>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}

export default OAuthCallback;
