import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ForgotPassword from "./pages/ForgotPassword";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Sidebar from "./components/Sidebar";
import Initialchat from "./pages/Initialchat";
import Analytics from "./pages/Analytics";
import ForgetPassword from "./components/ForgetPassword";
import ResetPassword from "./components/ResetPassword";
import SettingsPage from "./pages/Setting";
import Document from "./pages/documentUI";

// ProtectedRoute component to check auth tokens and user id on routes that need protection
const ProtectedRoute = ({ children }) => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const userId = localStorage.getItem("user_id");

  // If any of these are missing, redirect to login page
  if (!accessToken || !refreshToken || !userId) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise render the child elements (protected page)
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
       <Route path="/sidebar" element={<Sidebar/>} />
         <Route path="/initalchat" element={<Initialchat/>}/>
         <Route path="/analytics" element={<Analytics/>}/>
         <Route path="/forgetpassword" element={<ForgetPassword/>}/>
         <Route path="/resetpassword" element={<ResetPassword/>}/>
         <Route path="/setting" element={<SettingsPage/>}/>
           <Route path="/Document" element={<Document/>}/>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
