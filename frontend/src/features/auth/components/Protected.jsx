import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectLoggedInUser } from "../AuthSlice";

export const Protected = ({ children, requiresAdmin = false }) => {
    const user = useSelector(selectLoggedInUser);

    if (!user || !user.isVerified) {
        return <Navigate to={`/login?redirect=${window.location.pathname}`} replace />;
    }

    if (requiresAdmin && !user.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};