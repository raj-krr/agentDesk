"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<any>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const userData =
      localStorage.getItem("user");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (userData) {
      setUser(
        JSON.parse(userData)
      );
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    router.push("/auth/login");
  };

  return (
    <main className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            AgentDesk
          </h1>

          <p className="text-gray-500">
            Welcome{" "}
            {user?.name}
          </p>
        </div>

        <button
          onClick={logout}
          className="border px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="border rounded-xl p-6">
        <h2 className="text-xl font-semibold">
          Chat UI Coming Soon 🚀
        </h2>

        <p className="text-gray-500 mt-2">
          Authentication is working.
        </p>
      </div>
    </main>
  );
}