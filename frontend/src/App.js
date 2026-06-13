import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import NotesApp from './App/notes/NotesApp';
import LandingPage from './App/landing/LandingPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>
            <ToastContainer theme="dark" position="top-right" autoClose={3000} />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/notes" element={<NotesApp />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
