// frontend/src/App.tsx
import { AppRoutes } from "./routes/AppRoutes";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    console.log("App mounted");
    return () => console.log("App unmounted");
  }, []);

  return <AppRoutes />;
}

export default App;
