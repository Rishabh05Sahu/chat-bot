// src/components/TodoList.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLiveAPIContext } from "gemini-multimodal-live-voice-only";
import { motion } from "framer-motion";

const TodoList = () => {
  const speechActivity = useRef({
    lastActive: 0,
    timeoutId: null,
    isSpeaking: false
  });
  const { connected, client, connect, mute, unmute, muted, volume } = useLiveAPIContext();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [caption, setCaption] = useState(""); // New state for chatbot captions
  const videoRef = useRef(null);

  // Updated avatar state with backgrounds
  const [avatars, setAvatars] = useState([
    { 
      name: 'Default', 
      path: '/default.webm',
      background: '/BackNew1.jpeg' 
    },
    { 
      name: 'Chef', 
      path: '/chef.webm',
      background: '/chefBG.jpeg' 
    },
    { 
      name: 'Lawyer', 
      path: '/lawyerAvatar.webm',
      background: '/lawyer.jpg' 
    },
    { 
      name: 'receptionist', 
      path: '/rec.webm',
      background: '/recBG.jpeg' 
    },
    { 
      name: 'Santa claus', 
      path: '/santa.webm',
      background: '/santaBG.jpeg' 
    },
    { 
      name: 'Mickey Mouse', 
      path: '/mickeyMouse.webm',
      background: '/micBG.jpeg' 
    },
    { 
      name: 'Tom and Jerry', 
      path: '/tom.webm',
      background: '/tomBG.jpeg' 
    },
    { 
      name: 'King', 
      path: '/king.webm',
      background: '/BackNew1.jpeg'
    },
    { 
      name: 'Arabic', 
      path: '/arabic.webm',
      background: '/dubaiBG.jpeg' 
    },
    { 
      name: 'Arabic 2', 
      path: '/arabicNew.webm',
      background: '/dubaiBG.jpg' 
    },
    // { 
    //   name: 'Doctor', 
    //   path: '/doctor2.webm',
    //   background: '/doctorBG.jpeg' 
    // },
    { 
      name: 'Doctor ', 
      path: '/doctor3.webm',
      background: '/doctorBG.jpeg' 
    },
    { 
      name: 'Doctor 2', 
      path: '/realDoctor.webm',
      background: '/doctorBG.jpeg' 
    },
    { 
      name: 'Police', 
      path: '/police2.webm',
      background: '/BackNew1.jpeg' 
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
    const naturalPauseThreshold = 800;
    const endOfSpeechThreshold = 2000;

    const handleSpeechDetection = () => {
      const now = Date.now();
      const { lastActive, timeoutId, isSpeaking } = speechActivity.current;

      if (volume > speakingThreshold) {
        speechActivity.current.lastActive = now;
        
        if (!isSpeaking) {
          speechActivity.current.isSpeaking = true;
          setIsSpeaking(true);
          if (videoRef.current.paused || videoRef.current.ended) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.error("Play error:", e));
          }
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
          speechActivity.current.timeoutId = null;
        }
      } else if (isSpeaking) {
        const silenceDuration = now - lastActive;
        
        if (silenceDuration > naturalPauseThreshold && !timeoutId) {
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

  // Listen for chatbot responses and update caption
  useEffect(() => {
    const handleChatResponse = (response) => {
      if (response.text) {
        setCaption(response.text);
      }
    };

    client.on("response", handleChatResponse);
    return () => client.off("response", handleChatResponse);
  }, [client]);

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
      {/* Avatar Video Container */}
      <div className="w-2/5 p-4 flex flex-col items-center justify-center relative">
        <div className="absolute top-0 left-0 z-20 ml-4 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAvatarOptions(!showAvatarOptions)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            Change Avatar
          </motion.button>
          
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
            className="w-full h-full object-contain opacity-100"
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

      {/* Chat Container - Decreased Width */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gray-900 bg-opacity-50 backdrop-blur-xl p-8 rounded-xl shadow-2xl w-full max-w-md" // Changed max-w-2xl to max-w-md
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

        {/* Caption Box */}
        <div className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 bg-opacity-70 rounded-lg p-4 min-h-32 max-h-48 overflow-y-auto"
          >
            <p className="text-white text-lg">
              {caption || "Waiting for response..."}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default TodoList;