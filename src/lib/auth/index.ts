export const authConfig = {
  providers: [],
  pages: {
    signIn: "/admin",
  },
  trustHost: true,
};

export function requireAdminSession() {
  return {
    isAuthenticated: false,
    user: null,
  };
}
