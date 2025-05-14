'use client';

import React, { memo } from 'react';
import Image from 'next/image';

const OptimizedImage = memo(({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  quality = 75,
  ...props
}) => {
  // For external images that aren't on the allowed domains, use a regular img tag
  if (src && (src.startsWith('http') || src.startsWith('//'))) {
    try {
      const url = new URL(src.startsWith('//') ? `https:${src}` : src);
      // Check if domain is in the Next.js config
      const validDomains = []; // This should match your next.config.mjs domains

      if (!validDomains.includes(url.hostname)) {
        return (
          <img
            src={src}
            alt={alt}
            className={className}
            style={{
              maxWidth: '100%',
              height: 'auto',
              width: width || 'auto',
              height: height || 'auto'
            }}
            {...props}
          />
        );
      }
    } catch (e) {
      // Invalid URL, continue to use Next Image with a placeholder
    }
  }

  // Use next/image for optimized image loading
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={src || '/placeholder.jpg'}
        alt={alt || 'Image'}
        fill
        sizes={`(max-width: 768px) 100vw, ${width}px`}
        priority={priority}
        quality={quality}
        style={{ objectFit: 'cover' }}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;