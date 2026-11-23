import Home from "./pages/Home";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.tsx";
import Login from "./pages/auth/Login.tsx";
import Register from "./pages/auth/Register.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import ResetPassword from "./pages/auth/ResetPassword.tsx";
import Verify from "./pages/auth/Verify.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Discovery from "./pages/profiles/Discovery.tsx";
import ProfileView from "./pages/profiles/ProfileView.tsx";
import MyProfile from "./pages/profiles/MyProfile.tsx";
import JobsList from "./pages/jobs/JobsList.tsx";
import JobDetail from "./pages/jobs/JobDetail.tsx";
import JobForm from "./pages/jobs/JobForm.tsx";
import MyApplications from "./pages/applications/MyApplications.tsx";
import JobApplicants from "./pages/applications/JobApplicants.tsx";


export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/profiles" element={<Discovery />} />
                <Route path="/profiles/:id" element={<ProfileView />} />
                <Route path="/jobs" element={<JobsList />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify" element={<Verify />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profiles/me" element={<MyProfile />} />
                    <Route path="/jobs/new" element={<JobForm />} />
                    <Route path="/jobs/:id/edit" element={<JobForm />} />
                    <Route path="/applications/me" element={<MyApplications />} />
                    <Route path="/jobs/:id/applicants" element={<JobApplicants />} />
                </Route>
                <Route path="*" element={<Home />} />
            </Route>
        </Routes>
    );
}

