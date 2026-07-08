import React from "react";
import { AuthContext } from "./AuthContext";
import { clearAuth, getStoredAuth, storeAuth } from "./storage";
import { api } from "../lib/api";

export function AuthProvider({ children }) {
  const [{ token, user }, setState] = React.useState(() => getStoredAuth());
  const [loading, setLoading] = React.useState(() => Boolean(getStoredAuth().token));

  React.useEffect(() => {
    (async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        const me = await api.get("/api/auth/me", token);
        setState((s) => ({ ...s, user: me.user }));
        storeAuth({ token, user: me.user });
      } catch {
        clearAuth();
        setState({ token: null, user: null });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = React.useCallback(async ({ email, password }) => {
    const res = await api.post("/api/auth/login", { email, password });
    storeAuth({ token: res.token, user: res.user });
    setState({ token: res.token, user: res.user });
    return res;
  }, []);

  const register = React.useCallback(async (payload) => {
    const res = await api.post("/api/auth/register", payload);
    storeAuth({ token: res.token, user: res.user });
    setState({ token: res.token, user: res.user });
    return res;
  }, []);

  const logout = React.useCallback(() => {
    clearAuth();
    setState({ token: null, user: null });
  }, []);

  const value = React.useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token), login, register, logout }),
    [token, user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

