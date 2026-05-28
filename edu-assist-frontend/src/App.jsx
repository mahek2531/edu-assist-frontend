import React, { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { GameLoader, PageTransition } from "./Components/ui/GameUI";

const HomePage = lazy(() => import("./Components/HomePage"));
const AdminLoginPage = lazy(() => import("./Components/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./Components/AdminDashboard"));
const RegisterPage = lazy(() => import("./Components/RegisterPage"));
const LoginPage = lazy(() => import("./Components/LoginPage"));
const SeniorDashboard = lazy(() => import("./Components/SeniorDashboard"));
const JuniorDashboard = lazy(() => import("./Components/JuniorDashboard"));
const HelpPage = lazy(() => import("./Components/HelpPage"));
const CompleteProfilePage = lazy(() => import("./Components/CompleteProfilePage"));

const withTransition = (element) => <PageTransition>{element}</PageTransition>;

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Suspense
      fallback={
        <div className="ea-route-fallback">
          <GameLoader label="Loading interface..." />
        </div>
      }
    >
      <AnimatePresence initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Home Page */}
          <Route path="/" element={withTransition(<HomePage />)} />

          {/* Admin */}
          <Route path="/adminlogin" element={withTransition(<AdminLoginPage />)} />
          <Route path="/dashboard" element={withTransition(<AdminDashboard />)} />

          {/* Auth */}
          <Route path="/register/:role" element={withTransition(<RegisterPage />)} />
          <Route path="/login" element={withTransition(<LoginPage />)} />
          <Route path="/login/:role" element={withTransition(<LoginPage />)} />
          <Route path="/complete-profile/:role" element={withTransition(<CompleteProfilePage />)} />

          {/* Dashboards */}
          <Route path="/seniorDashboard" element={withTransition(<SeniorDashboard />)} />
          <Route path="/juniorDashboard" element={withTransition(<JuniorDashboard />)} />

          {/* Help Page */}
          <Route path="/help" element={withTransition(<HelpPage />)} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
