"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fetchCurrentUser,
  logout,
} from "@/lib/auth";

type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function UserPage() {

  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const loadUser =
      async () => {

        try {

          const data =
            await fetchCurrentUser();

          if (!data.success) {
            logout();
            return;
          }

          setUser(data.user);

        } catch (error) {

          console.error(error);

          logout();

        } finally {

          setLoading(false);
        }
      };

    loadUser();

  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-6">

          <h1 className="text-3xl font-bold">
            User Profile
          </h1>

          <button
            onClick={logout}
            className="px-4 py-2 border rounded-lg"
          >
            Logout
          </button>

        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">

          <div className="space-y-4">

            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="text-lg font-medium">
                {user?.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="text-lg font-medium">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                User ID
              </p>

              <p className="text-sm break-all">
                {user?.id}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Account Created
              </p>

              <p>
                {user?.createdAt
                  ? new Date(
                      user.createdAt
                    ).toLocaleString()
                  : "-"}
              </p>
            </div>

          </div>

        </div>

        <div className="mt-6 flex gap-4">

          <button
            onClick={() =>
              router.push("/chat")
            }
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            Go To Chat
          </button>

        </div>

      </div>

    </main>
  );
}