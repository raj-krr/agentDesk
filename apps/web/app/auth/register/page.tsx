"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { API } from "@/lib/api";

export default function RegisterPage() {
const router = useRouter();

const [form, setForm] = useState({
name: "",
email: "",
password: "",
});

const [showPassword, setShowPassword] =
useState(false);

const [loading, setLoading] =
useState(false);

const [error, setError] =
useState("");

const handleSubmit = async (
e: React.FormEvent
) => {
e.preventDefault();

setLoading(true);
setError("");

try {
  const response = await fetch(
    `${API.USERS}/register`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(form),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Registration failed"
    );
  }

  router.push("/auth/login");
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

return ( <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4"> <div className="w-full max-w-md"> <form
       onSubmit={handleSubmit}
       className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 space-y-5"
     > <div className="text-center"> <h1 className="text-3xl font-bold">
Create Account </h1>

        <p className="text-gray-500 mt-2">
          Join AgentDesk
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium">
          Full Name
        </label>

        <input
          type="text"
          placeholder="Enter your name"
          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
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
            placeholder="Create a password"
            className="w-full border rounded-lg p-3 pr-16 outline-none focus:ring-2 focus:ring-black"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password:
                  e.target.value,
              })
            }
            required
          />

          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600"
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
        disabled={loading}
        className="w-full rounded-lg bg-black text-white p-3 font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "Creating Account..."
          : "Register"}
      </button>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <a
          href="/auth/login"
          className="font-medium underline"
        >
          Login
        </a>
      </p>
    </form>
  </div>
</main>

);
}
