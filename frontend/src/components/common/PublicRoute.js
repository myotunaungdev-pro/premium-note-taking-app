import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = () => {
    const { token } = useSelector((state) => state.auth);

    // If there is a token, redirect to notes
    if (token) {
        return <Navigate to="/notes" replace />;
    }

    // Otherwise render the child routes (Landing, Login, Signup)
    return <Outlet />;
};

export default PublicRoute;
