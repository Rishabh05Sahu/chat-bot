// src/components/TodoList.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLiveAPIContext } from "gemini-multimodal-live-voice-only";
import { createTodo, getTodos, updateTodo, deleteTodo } from "./api";
import { motion, AnimatePresence } from "framer-motion";

const TodoList = () => {
  const speechActivity = useRef({
    lastActive: 0,
    timeoutId: null,
    isSpeaking: false
  });
  const { connected, client, connect, mute, unmute, muted, volume } = useLiveAPIContext();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const lastSpeakingTime = useRef(Date.now());
  const isProcessing = useRef(false);
  const speechTimeout = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const videoRef = useRef(null);

  // Updated avatar state with backgrounds
  const [avatars, setAvatars] = useState([
    { 
      name: 'Default', 
      path: '/default.webm',
      background: '/BackNew1.jpeg' 
    },
    { 
      name: 'King', 
      path: '/king.webm',
      background: '/king-bg.jpg'
    },
    { 
      name: 'Arabic', 
      path: '/arabic.webm',
      background: '/dubai.jpg' 
    },
    { 
      name: 'Arabic 2', 
      path: '/arabicNew.webm',
      background: '/dubai.jpg' 
    },
    { 
      name: 'Doctor', 
      path: '/doctor2.webm',
      background: '/hospital.jpg' 
    },
    { 
      name: 'Doctor 2', 
      path: '/doctor3.webm',
      background: '/hospital.jpg' 
    },
    { 
      name: 'Police', 
      path: '/police2.webm',
      background: '/police-bg.jpg' 
    }
  ]);

  const [selectedAvatar, setSelectedAvatar] = useState({
    path: '/default.webm',
    background: '/BackNew1.jpeg'
  });
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [avatarChangeKey, setAvatarChangeKey] = useState(0);

  // Auto-connect when component mounts
  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const initializeConnection = async () => {
      try {
        if (!connected) {
          console.log("Attempting to connect...");
          await connect();
          if (isMounted) {
            console.log("Successfully connected to voice API");
          }
        }
      } catch (error) {
        console.error("Connection error:", error);
        if (isMounted) {
          // Retry connection after delay with exponential backoff
          retryTimeout = setTimeout(initializeConnection, 5000);
        }
      }
    };

    initializeConnection();

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
    };
  }, [connect, connected]);

  // Fetch todos on mount
  useEffect(() => {
    loadTodos();
  }, []);

  // Fetch welcome message
  useEffect(() => {
    fetch(import.meta.env.VITE_SERVER_URL)
      .then((response) => response.text())
      .then((data) => setWelcomeMessage(data))
      .catch((error) => console.error("Error fetching welcome message:", error));
  }, []);

  // Detect when the chatbot is speaking (volume > threshold)
  useEffect(() => {
    const speakingThreshold = 0.1;
    const naturalPauseThreshold = 800; // Time between words (ms)
    const endOfSpeechThreshold = 2000; // Longer threshold for complete stop (2s)
  
    const handleSpeechDetection = () => {
      const now = Date.now();
      const { lastActive, timeoutId, isSpeaking } = speechActivity.current;
  
      if (volume > speakingThreshold) {
        // Speech activity detected
        speechActivity.current.lastActive = now;
        
        if (!isSpeaking) {
          // Start speaking state
          speechActivity.current.isSpeaking = true;
          setIsSpeaking(true);
          if (videoRef.current.paused || videoRef.current.ended) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.error("Play error:", e));
          }
        }
  
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
          speechActivity.current.timeoutId = null;
        }
      } else if (isSpeaking) {
        // Check if we should end speech
        const silenceDuration = now - lastActive;
        
        if (silenceDuration > naturalPauseThreshold && !timeoutId) {
          // Set timeout to end speech after full threshold
          speechActivity.current.timeoutId = setTimeout(() => {
            speechActivity.current.isSpeaking = false;
            speechActivity.current.timeoutId = null;
            setIsSpeaking(false);
            
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          }, endOfSpeechThreshold - naturalPauseThreshold);
        }
      }
    };
  
    // Use animation frame for smooth polling
    let animationFrameId;
    const checkVolume = () => {
      handleSpeechDetection();
      animationFrameId = requestAnimationFrame(checkVolume);
    };
  
    checkVolume();
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (speechActivity.current.timeoutId) {
        clearTimeout(speechActivity.current.timeoutId);
      }
    };
  }, [volume]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAvatarOptions && !event.target.closest('.relative')) {
        setShowAvatarOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAvatarOptions]);

  useEffect(() => {
    const onToolCall = async (toolCall) => {
      console.log(toolCall.functionCalls);
      const responses = await Promise.all(
        toolCall.functionCalls.map(async (fc) => {
          switch (fc.name) {
            case "create_todo":
              return await handleCreate(fc);
            case "read_todos":
              return await handleRead(fc);
            case "update_todo":
              return await handleUpdate(fc);
            case "delete_todo":
              return await handleDelete(fc);
            default:
              return {
                id: fc.id,
                response: { output: { error: "Unknown function" } },
              };
          }
        })
      );
      client.sendToolResponse({ functionResponses: responses });
    };

    client.on("toolcall", onToolCall);
    return () => client.off("toolcall", onToolCall);
  }, [client]);

  const loadTodos = async () => {
    try {
      const data = await getTodos();
      setTodos(data);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  // CRUD Function Handlers
  const handleCreate = async (fc) => {
    try {
      const data = await createTodo(fc.args.text);
      setTodos([...todos, data]);
      return { id: fc.id, response: { output: data } };
    } catch (error) {
      return { id: fc.id, response: { output: { error: error.message } } };
    }
  };

  const handleRead = async (fc) => {
    try {
      const data = await getTodos();
      setTodos(data);
      return { id: fc.id, response: { output: data } };
    } catch (error) {
      return { id: fc.id, response: { output: { error: error.message } } };
    }
  };

  const handleUpdate = async (fc) => {
    try {
      const data = await updateTodo(
        fc.args.id,
        fc.args.text,
        fc.args.completed
      );
      setTodos(todos.map((todo) => (todo._id === data._id ? data : todo)));
      return { id: fc.id, response: { output: data } };
    } catch (error) {
      return { id: fc.id, response: { output: { error: error.message } } };
    }
  };

  const handleDelete = async (fc) => {
    try {
      await deleteTodo(fc.args.id);
      setTodos(todos.filter((todo) => todo._id !== fc.args.id));
      return {
        id: fc.id,
        response: { output: { message: "Deleted successfully" } },
      };
    } catch (error) {
      return { id: fc.id, response: { output: { error: error.message } } };
    }
  };

  // Update the avatar selection handler
  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar({
      path: avatar.path,
      background: avatar.background
    });
    setAvatarChangeKey(prev => prev + 1);
    setShowAvatarOptions(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url('${selectedAvatar.background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.5s ease-in-out'
      }}
    >
      {/* Avatar Video Container with Change Avatar Button - Updated Size */}
      <div className="w-2/5 p-4 flex flex-col items-center justify-center relative">
        {/* Moved Avatar Selection Button to top-left */}
        <div className="absolute top-0 left-0 z-20 ml-4 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAvatarOptions(!showAvatarOptions)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            Change Avatar
          </motion.button>
          
          {/* Avatar Options Dropdown */}
          {showAvatarOptions && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden"
            >
              {avatars.map((avatar) => (
                <div
                  key={avatar.name}
                  onClick={() => handleAvatarSelect(avatar)}
                  className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer transition-colors flex items-center"
                >
                  {avatar.name}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Video Container with Animation - Increased Height */}
        <motion.div
          key={avatarChangeKey}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-[32rem] rounded-xl overflow-hidden shadow-2xl relative"
        >
          <video
            ref={videoRef}
            src={selectedAvatar.path}
            className="w-full h-full object-contain opacity-1000"
            style={{
              backgroundColor: 'transparent',
              transition: 'transform 0.2s ease-out',
              transform: isSpeaking ? 'scale(1.03)' : 'scale(1)'
            }}
            muted
            loop
            playsInline
            preload="auto"
          />
          {!isSpeaking && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg"></p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Todo List Container with the new background - Increased Width */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gray-900 bg-opacity-50 backdrop-blur-xl p-8 rounded-xl shadow-2xl w-full max-w-2xl"
        style={{
          backgroundImage: "url('/todo3.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <h1 className="text-3xl font-extrabold text-gray-100 text-center mb-6">
          Shivohini ChatBot ✨
        </h1>

        <div className="flex items-center justify-center mb-6 gap-1">
          <button 
            onClick={muted ? unmute : mute} 
            className={`${muted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-2 px-4 rounded cursor-pointer`}
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>

        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", delay: 0.2, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          className={`text-center text-lg font-semibold ${
            connected ? "text-green-400" : 
            client?.isConnecting ? "text-yellow-400" : "text-red-400"
          }`}
        >
          Voice Mode: {connected ? "🟢 Online" : client?.isConnecting ? "🟡 Connecting..." : "🔴 Disconnected"}
        </motion.p>

        {welcomeMessage ? (
          <div className="text-white text-center">{welcomeMessage}</div>
        ) : (
          <div className="text-white text-center text-green-400">Connecting to Server, Please Wait...!</div>
        )}

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-300 text-center mb-4">
            Todos
          </h2>
          <div className="overflow-hidden rounded-xl shadow-lg">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full bg-gray-900 text-gray-200">
                <thead className="sticky top-0 bg-gray-800">
                  <tr>
                    <th className="p-3 border-b border-gray-700">Sr No.</th>
                    <th className="p-3 border-b border-gray-700">Todo</th>
                    <th className="p-3 border-b border-gray-700">Completed</th>
                    <th className="p-3 border-b border-gray-700">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <AnimatePresence>
                    {todos.map((todo, index) => (
                      <motion.tr
                        key={todo._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-gray-700 transition-colors"
                      >
                        <td className="p-3 text-center">{index + 1}</td>
                        <td className="p-3">{todo.text}</td>
                        <td className="p-3 text-center">
                          {todo.completed ? "✅" : "🚧"}
                        </td>
                        <td className="p-3 text-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                              const confirmed = window.confirm(
                                `Are you sure you want to delete "${todo.text}"?`
                              );
                              if (!confirmed) return;
                              await deleteTodo(todo._id);
                              loadTodos();
                            }}
                            className="text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            ❌
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center">
          <motion.input
            whileFocus={{
              scale: 1.05,
              boxShadow: "0 0 10px rgba(255,255,255,0.2)",
            }}
            type="text"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none shadow-md"
            placeholder="New Todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <motion.button
            whileHover={{
              scale: 1.1,
              boxShadow: "0 0 10px rgba(0, 153, 255, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              await createTodo(newTodo);
              loadTodos();
              setNewTodo("");
            }}
            className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            ➕
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default TodoList;