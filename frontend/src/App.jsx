import React, { useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  useAuth,
} from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { dark } from "@clerk/themes";
import { setAuthToken } from "./services/api";

// Your components
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import GraphView from "./pages/GraphView";
import Resurface from "./pages/Resurface";

function App() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      setAuthToken(getToken);
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl" />
          <span>Synchronizing Brain...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <Routes>
          <Route
            path="/sign-in"
            element={
              <div className="h-screen flex items-center justify-center bg-[#0a0a0b] p-6">
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  appearance={{ 
                    baseTheme: dark,
                    elements: {
                      card: 'bg-white/5 backdrop-blur-md border border-white/10 shadow-none',
                      headerTitle: 'text-white',
                      headerSubtitle: 'text-gray-400',
                      socialButtonsBlockButton: 'bg-white/5 border-white/10 hover:bg-white/10',
                      formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 transition-all text-sm font-bold',
                    }
                  }}
                />
              </div>
            }
          />
          <Route
            path="/sign-up"
            element={
              <div className="h-screen flex items-center justify-center bg-[#0a0a0b] p-6">
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  appearance={{ baseTheme: dark }}
                />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/sign-in" />} />
        </Routes>
      </SignedOut>

      <SignedIn>
        <div className="flex h-screen bg-[#0a0a0b] text-white">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 p-6 overflow-y-auto scroll-smooth">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/graph" element={<GraphView />} />
                <Route path="/resurface" element={<Resurface />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}

export default App;