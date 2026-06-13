import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = () => {
    const { token } = useSelector((state) => state.auth);

    // If there is no token, redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
