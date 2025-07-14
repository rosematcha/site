import { useState } from 'react';
import type { Item } from '../types';

interface ItemGridProps {
  items: Item[];
  selectedCategory: string;
}

export function ItemGrid({ items, selectedCategory }: ItemGridProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const filteredItems = selectedCategory === 'All Items'
    ? items
    : items.filter(item =>
        item.category && item.category.split(',').map(c => c.trim()).includes(selectedCategory)
      );

  function openGallery(images: string[], idx: number) {
    setGalleryImages(images);
    setGalleryIdx(idx);
    setGalleryOpen(true);
  }

  function closeGallery() {
    setGalleryOpen(false);
  }

  function handleModalKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!galleryOpen) return;
    if (e.key === 'ArrowRight') setGalleryIdx(i => (i + 1) % galleryImages.length);
    if (e.key === 'ArrowLeft') setGalleryIdx(i => (i - 1 + galleryImages.length) % galleryImages.length);
    if (e.key === 'Escape') closeGallery();
  }

  return (
    <>
      <main className="items-grid" style={{maxWidth: '1100px', margin: '0 auto', minHeight: '600px'}}>
        {filteredItems.map((item, idx) => (
          <div key={item.name + idx} className={`item-card ${item.sold ? 'sold' : ''}`}>
            <div
              className="item-image"
              style={{width: '100%', height: '160px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', cursor: 'pointer', position: 'relative'}}
              onClick={() => openGallery(item.images.filter(Boolean), 0)}
              title="Click to zoom"
            >
              {item.images && item.images.length > 0 ? (
                <>
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    style={{objectFit: 'contain', width: '100%', height: '100%', background: '#fff', display: 'block'}}
                  />
                  {item.images.length > 1 && (
                    <span style={{position:'absolute',bottom:6,right:8,background:'#222d',color:'#fff',fontSize:'0.95em',padding:'2px 7px',borderRadius:'12px',display:'flex',alignItems:'center',gap:'4px'}}>
                      <span role="img" aria-label="camera">📷</span>
                      {item.images.length}
                    </span>
                  )}
                </>
              ) : (
                <div className="no-image">No Image Available</div>
              )}
            </div>
            <div className="item-details">
              <h2>{item.name}</h2>
              {item.desc && <p className="description">{item.desc}</p>}
              {item.price === 'fwp' ? (
                <>
                  <p className="price" style={{color: '#008000', fontWeight: 'bold', fontSize: '1.1rem'}}>Free</p>
                  <div style={{fontSize: '0.8rem', color: '#666', marginTop: '-0.5rem'}}>with purchase</div>
                </>
              ) : (
                <p className="price">{typeof item.price === 'string' ? item.price : `$${item.price.toFixed(2)}`}</p>
              )}
              {item.category && <p className="condition">Category: {item.category}</p>}
            </div>
          </div>
        ))}
      </main>
      {galleryOpen && (
        <div
          className="modal-gallery"
          tabIndex={0}
          onKeyDown={handleModalKey}
          style={{position:'fixed',zIndex:1000,top:0,left:0,right:0,bottom:0,background:'#181818ee',display:'flex',alignItems:'center',justifyContent:'center'}}
        >
          <button
            className="modal-gallery-close"
            onClick={closeGallery}
            style={{position:'absolute',top:24,right:32,fontSize:'2rem',background:'none',border:'none',color:'#fff',cursor:'pointer'}}
            aria-label="Close gallery"
          >×</button>
          <button
            className="modal-gallery-prev"
            onClick={() => setGalleryIdx(i => (i - 1 + galleryImages.length) % galleryImages.length)}
            style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',fontSize:'2.5rem',background:'none',border:'none',color:'#fff',cursor:'pointer'}}
            aria-label="Previous image"
          >&#8592;</button>
          <img
            src={galleryImages[galleryIdx]}
            alt={`Gallery image ${galleryIdx + 1}`}
            style={{maxHeight:'80vh',maxWidth:'90vw',borderRadius:4,boxShadow:'0 0 32px #000',background:'#181818'}}
          />
          <button
            className="modal-gallery-next"
            onClick={() => setGalleryIdx(i => (i + 1) % galleryImages.length)}
            style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',fontSize:'2.5rem',background:'none',border:'none',color:'#fff',cursor:'pointer'}}
            aria-label="Next image"
          >&#8594;</button>
        </div>
      )}
    </>
  );
}
