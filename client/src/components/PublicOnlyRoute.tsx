import { LoadingBlocks } from "./ui/Loading";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicOnlyRoute() {
    const { user, isLoading } = useAuth();
    if (isLoading) { return <div className="mx-auto max-w-6xl p-8"><LoadingBlocks /></div>; }
    if (user) { return <Navigate to="/dashboard" replace />; }
    return <Outlet />;
}

