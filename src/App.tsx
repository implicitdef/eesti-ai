import { useState } from "react";
import ApiKeyScreen from "./ApiKeyScreen";

function App() {
  const [apiKey, setApiKey] = useState("");

  if (!apiKey) {
    return <ApiKeyScreen onSubmit={setApiKey} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-700 text-white p-4 shadow">
        <h1 className="text-2xl font-bold">Eesti AI</h1>
        <p className="text-sm text-blue-200">Learn Estonian with AI</p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow p-6">
          <p className="text-gray-500 text-center">Chat coming soon...</p>
        </div>
      </main>
    </div>
  );
}

export default App;
