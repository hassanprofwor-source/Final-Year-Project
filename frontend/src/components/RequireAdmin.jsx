import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import Loader from "./ui/Loader";

const RequireAdmin = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return <Loader fullScreen />;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const role = user?.publicMetadata?.role;

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-center">
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="max-w-sm text-sm text-gray">
          This account does not have admin access to the Skyplate dashboard.
        </p>
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="rounded-xl bg-red px-4 py-2 text-sm font-semibold text-white hover:bg-red/90"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAdmin;
