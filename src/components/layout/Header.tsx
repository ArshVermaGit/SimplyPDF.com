"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthProvider";
import {
  Menu,
  X,
  Merge,
  Split,
  Minimize2,
  RotateCw,
  Image,
  FileImage,
  Lock,
  Unlock,
  Layers,
  Stamp,
  ChevronDown,
  History,
  LogOut,
  User,
} from "lucide-react";

const tools = [
  { title: "Merge PDF", icon: Merge, href: "/merge-pdf" },
  { title: "Split PDF", icon: Split, href: "/split-pdf" },
  { title: "Compress", icon: Minimize2, href: "/compress-pdf" },
  { title: "Rotate", icon: RotateCw, href: "/rotate-pdf" },
  { title: "JPG to PDF", icon: Image, href: "/jpg-to-pdf" },
  { title: "PDF to JPG", icon: FileImage, href: "/pdf-to-jpg" },
  { title: "Unlock", icon: Unlock, href: "/unlock-pdf" },
  { title: "Protect", icon: Lock, href: "/protect-pdf" },
  { title: "Organize", icon: Layers, href: "/organize-pdf" },
  { title: "Watermark", icon: Stamp, href: "/watermark-pdf" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, login, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm"
        : "bg-transparent"
        }`}
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-110 group-hover:rotate-3">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">
              Simply<span className="text-gray-400">PDF</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Tools Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowTools(true)}
              onMouseLeave={() => setShowTools(false)}
            >
              <button className="flex items-center gap-1 font-medium text-gray-700 hover:text-black transition-colors underline-hover py-2">
                All Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${showTools ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showTools && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                  >
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[480px] grid grid-cols-2 gap-2">
                      {tools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                            <tool.icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-sm">{tool.title}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/merge-pdf" className="font-medium text-gray-700 hover:text-black transition-colors underline-hover">
              Merge
            </Link>
            <Link href="/split-pdf" className="font-medium text-gray-700 hover:text-black transition-colors underline-hover">
              Split
            </Link>
            <Link href="/compress-pdf" className="font-medium text-gray-700 hover:text-black transition-colors underline-hover">
              Compress
            </Link>
            <Link href="/about" className="font-medium text-gray-700 hover:text-black transition-colors underline-hover">
              About
            </Link>
          </div>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              // Logged in - User dropdown
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{user.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{user.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/history"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <History className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">My History</span>
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Not logged in - Google Sign In button
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={login}
                  onError={() => console.log("Login Failed")}
                  theme="outline"
                  size="medium"
                  text="signin_with"
                  shape="pill"
                />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute left-0 w-6 h-0.5 bg-black transition-all duration-300 ${isMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-1"
                  }`}
              />
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-black transition-all duration-300 ${isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
              />
              <span
                className={`absolute left-0 w-6 h-0.5 bg-black transition-all duration-300 ${isMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-1"
                  }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6">
              {/* Mobile Auth Section */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(response) => {
                        login(response);
                        setIsMenuOpen(false);
                      }}
                      onError={() => console.log("Login Failed")}
                      theme="outline"
                      size="large"
                      text="signin_with"
                      width="280"
                    />
                  </div>
                )}
              </div>

              {/* Mobile History Link */}
              {user && (
                <Link
                  href="/history"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <History className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-sm">My History</span>
                </Link>
              )}

              <div className="grid grid-cols-2 gap-3">
                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <tool.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{tool.title}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/merge-pdf"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary w-full justify-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

