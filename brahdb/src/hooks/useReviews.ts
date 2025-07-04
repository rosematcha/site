import { useState, useEffect, useCallback } from 'react';
import type { Review, Restaurant } from '../types/Review';
import { restaurantDisplay } from '../constants/restaurantDisplay';

export const RATING_MIN = 0;
export const RATING_MAX = 10;
export const RATING_STEP = 0.1;
export const REVIEWS_PER_PAGE = 50;

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [restaurantOptions, setRestaurantOptions] = useState<{ value: Restaurant | 'All', label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getRestaurantsWithFewReviews = useCallback((reviews: Review[]): Set<Restaurant> => {
    const reviewCounts = reviews.reduce((acc, review) => {
      acc[review.restaurant] = (acc[review.restaurant] || 0) + 1;
      return acc;
    }, {} as Record<Restaurant, number>);

    return new Set(
      Object.entries(reviewCounts)
        .filter(([, count]) => count < 4)
        .map(([restaurant]) => restaurant as Restaurant)
    );
  }, []);

  // Get restaurants to show in dropdown (excluding those with few reviews)
  const getRestaurantOptions = useCallback((reviews: Review[]) => {
    const fewReviewRestaurants = getRestaurantsWithFewReviews(reviews);
    const allRestaurants = new Set(reviews.map(review => review.restaurant));
    
    return [
      { value: 'All' as const, label: 'All Restaurants' },
      { value: 'Other' as const, label: 'Other (Few Reviews)' },
      ...Array.from(allRestaurants)
        .filter(restaurant => !fewReviewRestaurants.has(restaurant))
        .sort()
        .map(restaurant => ({
          value: restaurant,
          label: restaurantDisplay[restaurant]?.display || restaurant
        }))
    ];
  }, [getRestaurantsWithFewReviews]);

  const fetchReviews = useCallback(async () => {
    try {
      const url = '/brahdb/reviews/reviews.json';
      console.log('[useReviews] Fetching reviews from', url);
      const response = await fetch(url);
      console.log('[useReviews] Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('[useReviews] Data type:', Array.isArray(data) ? 'array' : typeof data, 'Length:', Array.isArray(data) ? data.length : 'n/a');
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected an array of reviews');
      }
      setReviews(data);
      setRestaurantOptions(getRestaurantOptions(data));
      console.log('[useReviews] Reviews loaded successfully.');
    } catch (err) {
      console.error('[useReviews] Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading reviews');
    } finally {
      setLoading(false);
    }
  }, [getRestaurantOptions]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    restaurantOptions,
    loading,
    error,
    getRestaurantsWithFewReviews,
    refetch: fetchReviews
  };
}