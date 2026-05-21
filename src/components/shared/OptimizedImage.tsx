"use client";
import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  loading = "lazy",
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Optimize image URL for better quality
    if (!imageSrc) {
      const optimizedSrc = src
        .replace(/w:\d+/, 'w:1200') // Set width to 1200px for better quality
        .replace(/q:mauto/, 'q:best') // Use best quality
        + '&fit=crop&auto=format&cs=tinysrgb'; // Add optimization parameters
      
      setImageSrc(optimizedSrc);
    }
  }, [src, imageSrc]);

  return (
    <div className={`${className} overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300`}>
      <img
        src={imageSrc || src}
        alt={alt}
        loading={loading}
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        srcSet={`
          ${imageSrc || src}?w=400 400w,
          ${imageSrc || src}?w=800 800w,
          ${imageSrc || src}?w=1200 1200w,
          ${imageSrc || src}?w=1600 1600w
        `}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw"
        decoding="async"
      />
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      )}
    </div>
  );
};

export default OptimizedImage;
