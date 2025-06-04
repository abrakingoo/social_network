import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// For zoomable images in post cards, with width matching the post card (max-w-4xl)
export default function PostCardLightbox({ open, images, index, onClose, onPrev, onNext }) {
  if (!open || !images || images.length === 0) return null;
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={images.map((src) => ({ src }))}
      on={{
        clickPrev: onPrev,
        clickNext: onNext,
        clickSlide: onClose,
      }}
      styles={{
        container: {
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        root: {
          maxWidth: '896px', // max-w-4xl
          width: '100%',
          margin: 'auto',
        },
        slide: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        image: {
          maxWidth: '100%',
          maxHeight: '50vh',
          objectFit: 'contain',
          borderRadius: '1rem',
          boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
        },
      }}
    />
  );
}
