import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set initial RTL direction based on saved language
const savedLanguage = localStorage.getItem('app-language') || 'ar';
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;

createRoot(document.getElementById("root")!).render(<App />);
