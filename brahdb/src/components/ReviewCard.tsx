import React, { useState, useEffect } from 'react';
import type { Review, Restaurant } from '../types/Review';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ReviewCardProps {
  review: Review;
}

export const restaurantDisplay: Record<Restaurant, { display: string, logo: string }> = {
  'Arbys': { display: "Arby's", logo: 'arbys' },
  'AW': { display: 'A&W', logo: 'aw' },
  'BurgerKing': { display: 'Burger King', logo: 'burgerking' },
  'ChickFilA': { display: 'Chick-fil-A', logo: 'chickfila' },
  'Chipotle': { display: 'Chipotle', logo: 'chipotle' },
  'Culvers': { display: "Culver's", logo: 'culvers' },
  'DairyQueen': { display: 'Dairy Queen', logo: 'dairyqueen' },
  'DelTaco': { display: 'Del Taco', logo: 'deltaco' },
  'DiGiorno': { display: 'DiGiorno', logo: 'digiorno' },
  'Dominos': { display: "Domino's", logo: 'dominos' },
  'Dunkin': { display: 'Dunkin', logo: 'dunkin' },
  'FiveGuys': { display: 'Five Guys', logo: 'fiveguys' },
  'Freschetta': { display: 'Freschetta', logo: 'freschetta' },
  'Hardees': { display: "Hardee's", logo: 'hardees' },
  'HebrewNational': { display: 'Hebrew National', logo: 'hebrewnational' },
  'JackInTheBox': { display: 'Jack In The Box', logo: 'jackinthebox' },
  'JellO': { display: 'Jell-O', logo: 'jello' },
  'JimmyJohns': { display: "Jimmy John's", logo: 'jimmyjohns' },
  'KFC': { display: 'KFC', logo: 'kfc' },
  'KrispyKreme': { display: 'Krispy Kreme', logo: 'krispykreme' },
  'LittleCaesars': { display: "Little Caesar's", logo: 'littlecaesars' },
  'McDonalds': { display: "McDonald's", logo: 'mcdonalds' },
  'MrBeastBurger': { display: 'Mr. Beast Burger', logo: 'mrbeast' },
  'PandaExpress': { display: 'Panda Express', logo: 'pandaexpress' },
  'PaneraBread': { display: 'Panera Bread', logo: 'panerabread' },
  'PapaJohns': { display: "Papa John's", logo: 'papajohns' },
  'PDQ': { display: 'PDQ', logo: 'pdq' },
  'PizzaHut': { display: 'Pizza Hut', logo: 'pizzahut' },
  'Popeyes': { display: "Popeyes", logo: 'popeyes' },
  'RedBaron': { display: 'Red Baron Pizza', logo: 'redbaron' },
  'Sonic': { display: 'Sonic', logo: 'sonic' },
  'Starbucks': { display: 'Starbucks', logo: 'starbucks' },
  'SteakNShake': { display: "Steak 'n Shake", logo: 'steaknshake' },
  'Subway': { display: 'Subway', logo: 'subway' },
  'TacoBell': { display: 'Taco Bell', logo: 'tacobell' },
  'Wendys': { display: "Wendy's", logo: 'wendys' },
  'Wingstop': { display: 'Wingstop', logo: 'wingstop' },
  'Applebees': { display: "Applebee's", logo: 'applebees' },
  'BuffaloWildWings': { display: 'Buffalo Wild Wings', logo: 'buffalowildwings' },
  'CaliPizzaKitchen': { display: 'California Pizza Kitchen', logo: 'cpk' },
  'Coke': { display: 'Coca-Cola', logo: 'coke' },
  'Dennys': { display: "Denny's", logo: 'dennys' },
  'ShakeShack': { display: 'Shake Shack', logo: 'shakeshack' },
  'Zaxbys': { display: "Zaxby's", logo: 'zaxbys' },
  'Other': { display: 'Other', logo: 'other' },
  'Gerber': { display: 'Gerber', logo: 'gerber' },
  'Disney': { display: 'Walt Disney World', logo: 'disney' },
  'CheckersRallys': { display: "Checkers / Rally's", logo: 'checkers' },
  'Publix': { display: 'Publix', logo: 'publix' },
  'Sbarro': { display: 'Sbarro', logo: 'sbarro' },
  'HungryHowies': { display: "Hungry Howie's", logo: 'hungryhowies' },
  'WhiteCastle': { display: 'White Castle', logo: 'whitecastle' },
  'Oreo': { display: 'Oreo', logo: 'oreo' },
  'MunchPak': { display: 'MunchPak', logo: 'munchpak' },
  'CookOut': { display: 'Cook-Out', logo: 'cookout' },
  'Bojangles': { display: 'Bojangles', logo: 'bojangles' },
  'InNOut': { display: "In N' Out", logo: 'innout' },
  'ChipsAhoy': { display: 'Chips Ahoy', logo: 'chipsahoy' },
  'M&Ms': { display: "M&M's", logo: 'mms' },
  'Nathans': { display: "Nathan's Famous", logo: 'nathans' },
  'LongJohnSilvers': { display: "Long John Silver's", logo: 'longjohn' },
  'BostonMarket': { display: 'Boston Market', logo: 'bostonmarket' },
  'Pepsi': { display: 'Pepsi', logo: 'pepsi' },
  'MtnDew': { display: 'Mountain Dew', logo: 'mtndew' },
  'Soylent': { display: 'Soylent', logo: 'soylent' },
  'Hooters': { display: 'Hooters', logo: 'hooters' },
  'Krystal': { display: 'Krystal', logo: 'krystal' },
  'Biscuitville': { display: 'Biscuitville', logo: 'biscuitville' },
};

function getRatingColor(rating: number | null) {
  if (rating === null) return 'text-gray-400';
  if (rating >= 9.5) return 'font-bold text-yellow-300 drop-shadow-[0_0_6px_gold] animate-pulse';
  // Linear interpolate from red (1.0) to muted green (9.0)
  const min = 1, max = 9;
  const clamped = Math.max(min, Math.min(max, rating));
  const percent = (clamped - min) / (max - min);
  // Red to muted green: hsl(0,100%,50%) to hsl(120,60%,38%)
  const hue = 0 + percent * 120;
  const sat = 100 - percent * 40; // 100% to 60%
  const light = 50 - percent * 12; // 50% to 38%
  return `font-bold text-[hsl(${hue},${sat}%,${light}%)]`;
}

// Global cache for logo load/error state
const logoStatus: Record<string, 'loaded' | 'error' | undefined> = {};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { display, logo } = restaurantDisplay[review.restaurant] || { display: review.restaurant, logo: 'other' };
  const logoPath = `/logos/${logo}.svg`;
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