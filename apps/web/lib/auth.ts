export const getToken = () => {
  return localStorage.getItem(
    "token"
  );
};

export const getAuthHeaders = () => {
  const token = getToken();

  return {
    Authorization:
      `Bearer ${token}`,
    "Content-Type":
      "application/json",
  };
};

export const isAuthenticated = () => {
  return !!localStorage.getItem(
    "token"
  );
};

export const getStoredUser = () => {
  const user =
    localStorage.getItem("user");

  return user
    ? JSON.parse(user)
    : null;
};

export const fetchCurrentUser =
  async () => {

    const response =
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          headers:
            getAuthHeaders(),
        }
      );

    const data =
      await response.json();

    return data;
  };

export const logout = () => {
  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "user"
  );

  window.location.href =
    "/auth/login";
};