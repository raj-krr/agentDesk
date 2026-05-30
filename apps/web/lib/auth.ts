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

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href =
    "/auth/login";
};