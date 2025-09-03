import React from "react";
import { AuthProvider } from "./contexts/AuthContextSimple";
import Home from "./pages/HomeSimple";

function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}

export default App;
