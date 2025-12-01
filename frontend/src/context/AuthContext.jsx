import { createContext, useContext } from "react";

export const AuthContext = createContext({ token: "", user: null, setToken: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
