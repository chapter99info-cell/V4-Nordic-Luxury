import React, { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface PremiumVideoPlayerProps {
  videoSrc: string;
}

const PremiumVideoPlayer: React.FC<PremiumVideoPlayerProps> = ({ videoSrc }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl group">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted={isMuted}
        playsInline
      />

      {/* Sound Toggle Button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-6 right-6 p-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 transition-all shadow-lg group/btn z-20"
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
        ) : (
          <Volume2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
        )}
      </button>

      {/* Overlay Styling */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
    </div>
  );
};

export default PremiumVideoPlayer;
