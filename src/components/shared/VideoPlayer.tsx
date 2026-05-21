"use client";
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2, VolumeX, Maximize2, X } from 'lucide-react';

interface VideoPlayerProps {
  src?: string;
  youtubeId?: string;
  vimeoId?: string;
  poster: string;
  title: string;
  autoPlay?: boolean;
  muted?: boolean;
  onPlay?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  youtubeId,
  vimeoId,
  poster,
  title,
  autoPlay = true,
  muted = true,
  onPlay,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  // Self-hosted video player
  if (src) {
    return (
      <div
        ref={containerRef}
        className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl group"
        onMouseEnter={() => setIsPlaying(true)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          muted={isMuted}
          loop
          playsInline
          controls={isPlaying}
          className="w-full h-full object-cover"
          onPlay={handlePlay}
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPlaying(true)}
              className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl transition-all duration-300"
            >
              <Play className="w-6 h-6 text-gray-900 fill-gray-900" />
            </motion.button>
          </div>
        )}

        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4 z-20 flex items-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full transition-all duration-300"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFullscreen}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full transition-all duration-300"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  // YouTube embed
  if (youtubeId) {
    if (!isPlaying) {
      return (
        <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video">
          <img
            src={poster}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePlay}
              aria-label={`Play ${title}`}
              className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl transition-all duration-300"
            >
              <Play className="w-6 h-6 text-gray-900 fill-gray-900" />
            </motion.button>
          </div>
        </div>
      );
    }

    return (
      <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
        <iframe
          width="100%"
          height="600"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${muted ? 1 : 0}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full aspect-video"
        />
      </div>
    );
  }

  // Vimeo embed
  if (vimeoId) {
    return (
      <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoPlay ? 1 : 0}&muted=${muted ? 1 : 0}`}
          width="100%"
          height="600"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
          className="w-full h-full aspect-video"
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full bg-gray-200 rounded-2xl aspect-video flex items-center justify-center">
      <p className="text-gray-600">Video not available</p>
    </div>
  );
};

export default VideoPlayer;
