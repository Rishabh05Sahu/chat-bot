import React from 'react'

import { LiveAPIProvider } from 'gemini-multimodal-live-voice-only';
import 'gemini-multimodal-live-voice-only/dist/gemini-multimodal-live-voice-only.css';
import { functionDeclarations } from './utils/functionDeclarations';
import TodoList from './components/TodoList';

const App = () => (
  <LiveAPIProvider
    apiKey={import.meta.env.VITE_GEMINI_API_KEY}
    dynamicConfig={{
      voiceName: "Charon",
      systemInstruction: {
        parts: [{ text: "Your name is omiii. | You strictly Belongs from Maharashtra, India | You Are a Todo Assistance who strictly use function calls for TODO related tasks.| You strictly speaks only English language. | **Do not Express any Internal code related stuffs (e.g. function names and other more...) strictly**!" }]
      },
      tools: [
        { googleSearch: {} },
        { codeExecution: {} },
        { functionDeclarations }
      ]
    }}
  >
    {/* <ControlTray /> */}
    <TodoList />
  </LiveAPIProvider>
);

export default App;