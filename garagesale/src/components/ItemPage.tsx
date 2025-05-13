import { useParams, Link } from 'react-router-dom';
import type { Item } from '../types';
import { useState } from 'react';
import './ItemPage.css';

interface ItemPageProps {
  items: Item[];
}

export function ItemPage({ items }: ItemPageProps) {
  const { id } = useParams();
  const item = items[Number(id)];
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);

  if (!item) {
    return (
      <div className="not-found">
        <h2>Item Not Found</h2>
        <Link to="/" className="contact-btn">← Back to Items</Link>
      </div>
    );
  }

  // Keyboard navigation for modal
  function handleModalKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!galleryOpen) return;
    if (e.key === 'ArrowRight') setGalleryIdx(i => (i + 1) % item.images.length);
    if (e.key === 'ArrowLeft') setGalleryIdx(i => (i - 1 + item.images.length) % item.images.length);
    if (e.key === 'Escape') setGalleryOpen(false);
  }

  return (
    <div className="ebay-listing-page">
      <div className="ebay-ended-bar">
        This Buy It Now listing has ended.
      </div>
      <div className="ebay-breadcrumb">
        <Link to="/" className="breadcrumb-link">Back to home page</Link> &gt; 
        <span> {item.category} </span>
      </div>
      <div className="ebay-listing-main">
        <div className="ebay-listing-image-box" style={{background: '#181818'}}>
          {item.images.length > 0 ? (
            <img
              src={item.images[galleryIdx].replace('/garagesale', '')}
              alt={item.name + ' ' + (galleryIdx + 1)}
              style={{ maxWidth: '100%', maxHeight: '100%', cursor: 'pointer', borderRadius: 2 }}
              onClick={() => setGalleryOpen(true)}
            />
          ) : (
            <div className="no-image">No Image Available</div>
          )}
        </div>
        <div className="ebay-listing-info-col">
          <h1 className="ebay-listing-title">{item.name}</h1>
          <div className="ebay-listing-meta">
            <div><b>Item condition:</b> {item.condition}</div>
            <div><b>Category:</b> {item.category}</div>
          </div>
          <div className="ebay-listing-infobox">
            <div className="ebay-listing-price-row">
              <span className="ebay-listing-sold-label">Sold For:</span>
              <span className="ebay-listing-price">{item.price === 'fwp' ? 'Free' : `$${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}`}</span>
            </div>
            <div className="ebay-listing-shipping">
              <b>Shipping:</b> $30.00 Expedited Shipping | <span className="ebay-listing-details-link">See all details</span>
            </div>
            <div className="ebay-listing-delivery">
              <b>Delivery:</b> Estimated within 5-6 business days
            </div>
            <div className="ebay-listing-returns">
              <b>Returns:</b> 7 day money back, buyer pays return shipping | <span className="ebay-listing-details-link">Read details</span>
            </div>
          </div>
          <div className="ebay-listing-desc-box">
            <h3>Description:</h3>
            <p>{item.desc || <span style={{color:'#888'}}>No description provided.</span>}</p>
          </div>
          <div className="ebay-buyer-protection">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Ebay-buyer-protection.png" alt="eBay Buyer Protection" />
            <span>eBay Buyer Protection: Covers your purchase price plus original shipping.</span>
          </div>
          <Link to="/" className="contact-btn" style={{marginTop: '1rem'}}>← Back to Items</Link>
        </div>
      </div>
      {galleryOpen && (
        <div
          className="modal-gallery"
          tabIndex={0}
          onKeyDown={handleModalKey}
          style={{position:'fixed',zIndex:1000,top:0,left:0,right:0,bottom:0,background:'#181818ee',display:'flex',alignItems:'center',justifyContent:'center'}}
        >
          <button
            className="modal-gallery-close"
            onClick={() => setGalleryOpen(false)}
            style={{position:'absolute',top:24,right:32,fontSize:'2rem',background:'none',border:'none',color:'#fff',cursor:'pointer'}}
            aria-label="Close gallery"
          >×</button>
          <button
            className="modal-gallery-prev"
            onClick={() => setGalleryIdx(i => (i - 1 + item.images.length) % item.images.length)}
            style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',fontSize:'2.5rem',background:'none',border:'none',color:'#fff',cursor:'pointer'}}
            aria-label="Previous image"
          >&#8592;</button>
          <img
            src={item.images[galleryIdx].replace('/garagesale', '')}
            alt={item.name + ' ' + (galleryIdx + 1)}
            style={{maxHeight:'80vh',maxWidth:'90vw',borderRadius:4,boxShadow:'0 0 32px #000'}}
          />
          <button
            className="modal-gallery-next"
            onClick={() => setGalleryIdx(i => (i + 1) % item.images.length)}
            style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',fontSize:'2.5rem',background:'none',border:'none',color:'#fff',cursor:'pointer'}}
            aria-label="Next image"
          >&#8594;</button>
        </div>
      )}
    </div>
  );
}
