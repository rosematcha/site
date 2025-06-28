import React, { useState, useEffect } from 'react';
import type { Review } from '../types/Review';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ReviewCardProps {
  review: Review;
}
import { restaurantDisplay } from '../constants/restaurantDisplay';
import { getRatingColor, logoStatus } from '../utils/reviewUtils';

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { display, logo } = restaurantDisplay[review.restaurant] || { display: review.restaurant, logo: 'other' };
  const logoPath = `/brahdb/logos/${logo}.svg`;
  // Use global cache to initialize state
  const [logoLoaded, setLogoLoaded] = useState(() => logoStatus[logoPath] === 'loaded');
  const [logoError, setLogoError] = useState(() => logoStatus[logoPath] === 'error');

  useEffect(() => {
    // If logo is already loaded or errored, don't re-run
    if (logoStatus[logoPath] === 'loaded') {
      setLogoLoaded(true);
      setLogoError(false);
      return;
    }
    if (logoStatus[logoPath] === 'error') {
      setLogoLoaded(false);
      setLogoError(true);
      return;
    }
    // Otherwise, let the <img> handlers update state
  }, [logoPath]);

  return (
    <div className="flex items-center bg-gray-800 rounded-lg shadow p-3 md:p-4 my-2 w-full max-w-[1200px] mx-auto gap-x-6 px-6 md:px-10">
      <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gray-800 rounded-md flex items-center justify-center overflow-hidden relative">
        <img
          src={logoPath}
          alt={`${display} logo`}
          className={`w-full h-full object-contain transition-opacity duration-300 ${logoLoaded && !logoError ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => {
            logoStatus[logoPath] = 'loaded';
            setLogoLoaded(true);
            setLogoError(false);
          }}
          onError={() => {
            logoStatus[logoPath] = 'error';
            setLogoLoaded(false);
            setLogoError(true);
          }}
        />
        {logoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-400">
            {display.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0 px-4">
        <span className="font-semibold text-lg md:text-xl truncate">{review.itemName}</span>
        <span className="text-sm md:text-base text-gray-300 truncate">{display}</span>
      </div>
      <div className="flex flex-col md:flex-row items-end md:items-center gap-y-1 md:gap-x-6 min-w-fit text-right">
        <span className="text-sm md:text-base whitespace-nowrap">
          <span className="hidden md:inline">Rating: </span>
          <span className={getRatingColor(review.rating)}>
            {review.rating !== null ? review.rating.toFixed(1) : 'N/A'}
          </span>
        </span>
        <span className="text-sm md:text-base whitespace-nowrap">{new Date(review.reviewDate).toLocaleDateString()}</span>
        <a
          href={review.reviewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-blue-400 hover:text-blue-300 flex items-center justify-end"
          title="Watch Review"
        >
          <ArrowTopRightOnSquareIcon className="w-6 h-6 text-white" />
        </a>
      </div>
    </div>
  );
};