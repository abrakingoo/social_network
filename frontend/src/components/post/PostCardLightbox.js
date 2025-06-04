import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// FOr zoomable images in post cards
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
        container: { zIndex: 9999 },
      }}
    />
  );
}
