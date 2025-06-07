import React, { useState } from 'react';

export default function PhotoCard({ url }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        className="photo-thumb"
        src={url}
        alt="Guest upload"
        loading="lazy"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          <img src={url} alt="Full view" />
        </div>
      )}
    </>
  );
}
