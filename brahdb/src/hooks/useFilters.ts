import { useState, useMemo } from 'react';
import type { Review, Restaurant } from '../types/Review';
import { restaurantDisplay } from '../constants/restaurantDisplay';

export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export function useFilters(
  reviews: Review[],
  ratingRange: [number, number]
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | 'all' | 'other'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Calculate restaurant counts and determine which ones go in "Other"
  const { restaurantOptions, otherRestaurants } = useMemo(() => {
    const counts = reviews.reduce((acc, review) => {
      acc[review.restaurant] = (acc[review.restaurant] || 0) + 1;
      return acc;
    }, {} as Record<Restaurant, number>);

    const mainRestaurants = Object.entries(counts)
      .filter(([, count]) => count > 5)
      .map(([restaurant]) => restaurant as Restaurant)
      .sort();

    const otherRestaurants = Object.entries(counts)
      .filter(([, count]) => count <= 5)
      .map(([restaurant]) => restaurant as Restaurant)
      .sort();

    return {
      restaurantOptions: mainRestaurants,
      otherRestaurants
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    // Sort by selected option
    const sortedReviews = [...reviews];
    switch (sortBy) {
      case 'oldest':
        sortedReviews.sort((a, b) => new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime());
        break;
      case 'highest':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'newest':
      default:
        sortedReviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
        break;
    }

    // Filter by restaurant first
    let filtered = sortedReviews;
    if (selectedRestaurant !== 'all') {
      if (selectedRestaurant === 'other') {
        filtered = sortedReviews.filter(review => 
          otherRestaurants.includes(review.restaurant)
        );
      } else {
        filtered = sortedReviews.filter(review => 
          review.restaurant === selectedRestaurant
        );
      }
    }

    // Filter by rating range
    filtered = filtered.filter(review =>
      review.rating >= ratingRange[0] && review.rating <= ratingRange[1]
    );

    // Then filter by search if there's a query
    if (!searchQuery.trim()) {
      return filtered;
    }

    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(review => {
      const itemName = review.itemName.toLowerCase();
      const restaurantName = restaurantDisplay[review.restaurant]?.display.toLowerCase() || review.restaurant.toLowerCase();
      return itemName.includes(query) || restaurantName.includes(query);
    });

    return filtered;
  }, [reviews, searchQuery, selectedRestaurant, otherRestaurants, ratingRange, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    selectedRestaurant,
    setSelectedRestaurant,
    restaurantOptions,
    otherRestaurants,
    sortBy,
    setSortBy,
    filteredReviews
  };
} 