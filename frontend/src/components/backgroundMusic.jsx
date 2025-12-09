// src/components/BackgroundMusic.jsx
import { useEffect, useRef, useState } from "react";
import { FaMusic } from "react-icons/fa";
import mySong from "../assets/song.mp3";

export default function backgroundMusic() {
  const audioRef = useRef(new Audio(mySong));
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = 0.3; // initial low volume
    audio.muted = true; // allow autoplay

    // Try autoplay muted
    audio.play().catch(() => {
      console.log("Autoplay blocked, waiting for user interaction");
    });
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.muted = false; // unmute on user click
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      onClick={togglePlay}
      title={isPlaying ? "Pause Music" : "Play Music"}
    >
      <FaMusic
        style={{
          color: isPlaying ? "#ff4081" : "#555",
          animation: isPlaying
            ? "bounce 1s infinite alternate"
            : "none",
          fontSize: "24px",
        }}
      />
      <span>{isPlaying ? "Music On" : "Click to Play"}</span>

      {/* Simple bounce animation */}
      <style>
        {`
          @keyframes bounce {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
