/* 
 * LOGIN PAGE - COMMENTED OUT
 * 
 * This login page is currently disabled. Users are auto-authenticated.
 * To restore login requirement:
 * 1. Uncomment this file
 * 2. Remove auto-login logic in AuthContext.tsx
 * 3. Restore auth checks in page.tsx and chat/page.tsx
 */

"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// COMMENTED OUT: Login page disabled - redirecting to chat
export default function LoginPage() {
  const router = useRouter();
  
  // Auto-redirect to chat (login not required)
  useEffect(() => {
    router.push('/chat');
  }, [router]);
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

/* COMMENTED OUT: Original login page code
export default function LoginPageOriginal() {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "apiKey") {
      setApiKey(value);
    } else if (name === "email") {
      setEmail(value);
    }
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError("Please enter your API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(apiKey, email || undefined);

      if (result.success) {
        // Redirect to chat interface
        router.push("/chat");
      } else {
        setError(result.error || "Login failed. Please check your API key.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#F5F4F1" }}
    >
      <div className="w-[400px] space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-black">Deputeti AI</h2>
          <p className="mt-2 text-sm text-body">Login with your API key</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field (Optional) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black mb-2"
              >
                Email Address (Optional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                className="block w-full py-3 px-3 border border-stroke rounded-lg bg-gray-1 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                placeholder="your.email@example.com"
              />
            </div>

            {/* API Key Field */}
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-black mb-2"
              >
                API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  name="apiKey"
                  type={showApiKey ? "text" : "password"}
                  required
                  value={apiKey}
                  onChange={handleChange}
                  className="block w-full pr-10 py-3 px-3 border border-stroke rounded-lg bg-gray-1 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeOff className="h-5 w-5 text-body hover:text-primary transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-body hover:text-primary transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-black/90 focus:ring-2 focus:ring-black focus:ring-offset-2 cursor-pointer hover:cursor-pointer"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-body">© 2025 Deputeti AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
*/ // End of commented login page
