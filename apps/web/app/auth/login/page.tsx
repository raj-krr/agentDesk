"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { API } from "@/lib/api";

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [showPassword, setShowPassword] =
useState(false);

const [loading, setLoading] =
useState(false);

const [error, setError] =
useState("");

const [demoLoading, setDemoLoading] = useState(false);

const handleTryDemo = async () => {
  setDemoLoading(true);
  setError("");

  try {
    const response = await fetch(
      `${API.USERS}/demo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to set up demo session");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    router.push("/chat");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong setting up the demo session"
    );
  } finally {
    setDemoLoading(false);
  }
};

const handleSubmit = async (
e: React.FormEvent
) => {
e.preventDefault();

setLoading(true);
setError("");

try {
  const response = await fetch(
    `${API.USERS}/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Login failed"
    );
  }

  localStorage.setItem(
    "token",
    data.token
  );

  localStorage.setItem(
    "user",
    JSON.stringify(data.user)
  );

  router.push("/chat");
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Something went wrong"
  );
} finally {
  setLoading(false);
}

};

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 space-y-5"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Login to AgentDesk</p>
          </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">
          Password
        </label>

        <div className="relative">
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Enter your password"
            className="w-full border rounded-lg p-3 pr-16 outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
          />

          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 cursor-pointer"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
          >
            {showPassword
              ? "Hide"
              : "Show"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || demoLoading}
        className="w-full rounded-lg bg-black text-white p-3 font-medium hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
      >
        {loading
          ? "Logging in..."
          : "Login"}
      </button>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-zinc-200"></div>
        <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider font-semibold text-zinc-400">or</span>
        <div className="flex-grow border-t border-zinc-200"></div>
      </div>

      <button
        type="button"
        onClick={handleTryDemo}
        disabled={loading || demoLoading}
        className="w-full rounded-lg bg-white border border-purple-200 hover:border-purple-300 text-purple-700 hover:bg-purple-50/50 p-3 font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
      >
        {demoLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
            Setting up demo session...
          </>
        ) : (
          <>
            ⚡ Explore in Demo Mode
          </>
        )}
      </button>

      <p className="text-center text-sm pt-2 text-zinc-500">
        Don't have an account?{" "}
        <a
          href="/auth/register"
          className="font-medium underline text-black"
        >
          Register
        </a>
      </p>
    </form>
  </div>
</main>

);
}

