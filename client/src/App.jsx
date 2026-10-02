import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import { getCurrentUser } from './services/api'
import { useDispatch, useSelector } from 'react-redux'
import History from './pages/History'
import Notes from './pages/Notes'
import Pricing from './pages/Pricing'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailed from './pages/PaymentFailed'
import OAuthCallback from './pages/OAuthCallback'
export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

function App() {
  const dispatch = useDispatch()
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(!!localStorage.getItem("token"));
  
  useEffect(()=>{
   const checkAuth = async () => {
     if (localStorage.getItem("token")) {
       await getCurrentUser(dispatch);
     }
     setIsCheckingAuth(false);
   };
   checkAuth();
  },[dispatch])

  const {userData} = useSelector((state)=>state.user)

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-black font-semibold">Loading...</div>
  }

  return (
    <>
    <Routes>
      <Route path='/' element={userData? <Home/> : <Navigate to="/auth" replace/>}/>
      <Route path='/auth' element={userData ? <Navigate to="/" replace/> : <Auth/>}/>
      <Route path='/auth/callback' element={<OAuthCallback/>}/>
      <Route path='/__/auth/handler' element={<OAuthCallback/>}/>
      <Route path='/history' element={userData? <History/> : <Navigate to="/auth" replace/>}/>
      <Route path='/notes' element={userData? <Notes/> : <Navigate to="/auth" replace/>}/>
      <Route path='/pricing' element={userData? <Pricing/> : <Navigate to="/auth" replace/>}/>

      <Route path='/payment-success' element={<PaymentSuccess/>}/>
      <Route path='/payment-failed' element={<PaymentFailed/>}/>
    </Routes>
     
    </>
  )
}

export default App
