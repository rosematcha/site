import { useState, useEffect, useMemo, useRef } from 'react';
import { ReviewCard } from './components/ReviewCard';
import type { Review, Restaurant } from './types/Review';
import Stats from './Stats';
import LoadingSpinner from './components/LoadingSpinner';
import { useReviews } from './hooks/useReviews';
import { useFilters, SortOption } from './hooks/useFilters';
import { usePagination } from './hooks/usePagination';
import { useLogos } from './hooks/useLogos';
import { restaurantDisplay } from './constants/restaurantDisplay';
import Slider from '@mui/material/Slider';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Add global styles to prevent layout shift
const globalStyles = `
  html, body {
    background: #181a1b !important;
    color: #f3f4f6 !important;
  }
  .bg-gray-900, .bg-gray-950 {
    background-color: #181a1b !important;
  }
  .bg-gray-800 {
    background-color: #23272f !important;
  }
  .text-white, .text-gray-100 {
    color: #f3f4f6 !important;
  }
  .text-gray-300, .text-gray-400 {
    color: #bfc3ca !important;
  }
  .container {
    background: none !important;
  }
  .rounded-lg, .shadow, .shadow-sm {
    background-color: #23272f !important;
    box-shadow: 0 2px 8px 0 #0002 !important;
    border: none !important;
  }
  .rounded-lg:hover, .shadow:hover, .shadow-sm:hover {
    background-color: #2c313a !important;
    box-shadow: 0 4px 16px 0 #0004 !important;
  }
  .bg-blue-500, .bg-blue-600, .text-blue-400, .hover:text-blue-300:hover, .button-accent {
    background-color: #2563eb !important;
    color: #f3f4f6 !important;
    border: none !important;
  }
  .hover:bg-blue-500:hover, .hover:bg-blue-600:hover, button:hover, .button-accent:hover {
    background-color: #3b82f6 !important;
    color: #f3f4f6 !important;
  }
  .bg-gray-700 {
    background-color: #323843 !important;
  }
  input, select {
    background-color: #23272f !important;
    color: #f3f4f6 !important;
    border: 1.5px solid #444857 !important;
  }
  button, .button-accent {
    background-color: #2563eb !important;
    color: #f3f4f6 !important;
    font-weight: 600 !important;
    border-radius: 6px !important;
    transition: background 0.15s;
  }
  .font-semibold, .font-bold, .text-lg, .text-xl, .text-2xl, .text-3xl, .text-4xl, .text-5xl {
    font-weight: 700 !important;
  }
`;

function App() {
  // Page state
  const [showStats, setShowStats] = useState(false);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Use custom hooks
  const { reviews, loading, error, refetch } = useReviews();
  const { errors: logoErrors } = useLogos();

  // Handle initial loading state
  useEffect(() => {
    if (!loading) {
      if (logoErrors.length > 0) {
        console.warn('Some logos failed to load, continuing anyway');
      }
      setInitialLoading(false);
    }
  }, [loading, logoErrors]);

  // Handle view changes only (not filter changes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {}, 300);
    return () => clearTimeout(timeoutId);
  }, [showStats]);

  // Compute min/max rating from reviews
  const [minRating, maxRating] = useMemo(() => {
    if (!reviews.length) return [0, 10];
    let min = reviews[0].rating;
    let max = reviews[0].rating;
    for (const r of reviews) {
      if (r.rating < min) min = r.rating;
      if (r.rating > max) max = r.rating;
    }
    return [Math.floor(min), Math.ceil(max)];
  }, [reviews]);

  // Rating range state
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  // Initialize rating range when min/max change
  useEffect(() => {
    setRatingRange([minRating, maxRating]);
  }, [minRating, maxRating]);

  const { 
    searchQuery, 
    setSearchQuery, 
    selectedRestaurant,
    setSelectedRestaurant,
    restaurantOptions,
    otherRestaurants,
    sortBy,
    setSortBy,
    filteredReviews 
  } = useFilters(reviews, ratingRange);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const paginationRef = useRef<HTMLDivElement | null>(null);

  // Scroll pagination controls into view when page changes
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
  }, [currentPage]);

  // Reset to page 1 when filteredReviews changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReviews]);

  const {
    paginatedReviews,
    totalPages
  } = usePagination(filteredReviews, currentPage);

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Add clear filters handler
  function clearFilters() {
    setSearchQuery('');
    setSelectedRestaurant('all');
    setSortBy('newest');
    setRatingRange([minRating, maxRating]);
  }

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Reviews</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 md:gap-0">
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm pb-2 border-b border-gray-700 md:border-0 md:pb-0">ReviewBrah's Fast Food Reviews</h1>
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-2 px-6 rounded-lg shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            >
              {showStats ? 'Show Reviews' : 'Show Stats'}
            </button>
          </div>

          {showStats ? (
            <Stats reviews={reviews} />
          ) : (
            <>
              {/* Improved Filter Bar */}
              <div className="mb-8 w-full bg-gray-800/80 rounded-xl shadow-lg px-4 py-4 border border-gray-700 flex flex-col gap-3">
                {/* Row 1: Search Bar */}
                <div className="flex w-full items-center gap-2">
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search items or restaurants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  </div>
                  <button
                    className="flex items-center px-3 py-2 bg-gray-700 rounded-lg ml-2 border border-gray-700 hover:bg-gray-600 transition"
                    onClick={() => setShowFilters(f => !f)}
                    title="Toggle Filters"
                  >
                    <FunnelIcon className={`w-5 h-5 ${showFilters ? 'text-blue-400' : 'text-gray-400'}`} />
                  </button>
                </div>
                {/* Row 2: Filters (justified, responsive) */}
                {showFilters && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3 items-center mt-2">
                    <select
                      value={selectedRestaurant}
                      onChange={(e) => setSelectedRestaurant(e.target.value as Restaurant | 'all' | 'other')}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full"
                    >
                      <option value="all">All Restaurants</option>
                      {restaurantOptions.map(restaurant => (
                        <option key={restaurant} value={restaurant}>
                          {restaurantDisplay[restaurant]?.display || restaurant}
                        </option>
                      ))}
                      {otherRestaurants.length > 0 && (
                        <option value="other">Other Restaurants</option>
                      )}
                    </select>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                    </select>
                    {/* Rating Filter: on same row for md+, own row for sm */}
                    <div className="flex flex-col w-full">
                      <span className="text-xs text-gray-400 mb-1">Rating</span>
                      <div className="flex items-center gap-2 w-full">
                        <Slider
                          value={ratingRange}
                          min={minRating}
                          max={maxRating}
                          step={0.1}
                          onChange={(_, values) => Array.isArray(values) && setRatingRange([values[0], values[1]])}
                          valueLabelDisplay="off"
                          size="small"
                          sx={{ color: '#2563eb', width: '100%' }}
                        />
                        <span className="text-xs text-gray-400 font-mono flex gap-1">
                          <span className="inline-block w-7 text-center">{ratingRange[0].toFixed(1)}</span>
                          –
                          <span className="inline-block w-7 text-center">{ratingRange[1].toFixed(1)}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-700 text-sm text-white transition w-full"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Filter Modal */}
              <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                  <Dialog.Panel className="w-full max-w-md bg-gray-800 rounded-lg p-6 mx-auto">
                    <div className="flex justify-between items-center mb-4">
                      <Dialog.Title className="text-lg font-bold">Filters</Dialog.Title>
                      <button onClick={() => setFilterModalOpen(false)}>
                        <XMarkIcon className="w-6 h-6 text-gray-300" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <select
                        value={selectedRestaurant}
                        onChange={(e) => setSelectedRestaurant(e.target.value as Restaurant | 'all' | 'other')}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                      >
                        <option value="all">All Restaurants</option>
                        {restaurantOptions.map(restaurant => (
                          <option key={restaurant} value={restaurant}>
                            {restaurantDisplay[restaurant]?.display || restaurant}
                          </option>
                        ))}
                        {otherRestaurants.length > 0 && (
                          <option value="other">Other Restaurants</option>
                        )}
                      </select>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as SortOption)}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                      <div className="flex flex-col gap-2 w-full">
                        <span className="text-xs text-gray-400">Rating Range</span>
                        <div className="flex items-center gap-2 w-full">
                          <Slider
                            value={ratingRange}
                            min={minRating}
                            max={maxRating}
                            step={0.1}
                            onChange={(_, values) => Array.isArray(values) && setRatingRange([values[0], values[1]])}
                            valueLabelDisplay="off"
                            size="small"
                            sx={{ color: '#2563eb', width: '100%' }}
                          />
                          <span className="text-xs text-gray-400 font-mono flex gap-1">
                            <span className="inline-block w-7 text-center">{ratingRange[0].toFixed(1)}</span>
                            –
                            <span className="inline-block w-7 text-center">{ratingRange[1].toFixed(1)}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { clearFilters(); setFilterModalOpen(false); }}
                        className="w-full mt-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </Dialog.Panel>
                </div>
              </Dialog>

              {/* Reviews */}
              <div className="space-y-4 transition-[height] duration-300 ease-in-out">
                {paginatedReviews.map((review: Review) => (
                  <div 
                    key={`${review.reviewLink}-${review.itemName}-${review.rating}`}
                    className="transform transition-transform duration-300 ease-in-out"
                  >
                    <ReviewCard review={review} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div ref={paginationRef} className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
