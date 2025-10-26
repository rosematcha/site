import { useMemo } from 'react';
import type { Review, Restaurant } from '../types/Review';
import { restaurantDisplay } from '../constants/restaurantDisplay';

interface RestaurantStats {
  restaurant: Restaurant;
  display: string;
  count: number;
  averageRating: number;
}

interface RatingDistribution {
  rating: number;
  count: number;
}

export function useStats(reviews: Review[]) {
  const restaurantStats = useMemo(() => {
    const stats = new Map<Restaurant, { count: number; totalRating: number }>();

    reviews.forEach(review => {
      const current = stats.get(review.restaurant) || { count: 0, totalRating: 0 };
      stats.set(review.restaurant, {
        count: current.count + 1,
        totalRating: current.totalRating + (review.rating || 0)
      });
    });

    return Array.from(stats.entries())
      .map(([restaurant, { count, totalRating }]): RestaurantStats => ({
        restaurant,
        display: restaurantDisplay[restaurant]?.display || restaurant,
        count,
        averageRating: totalRating / count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const distribution = new Map<number, number>();

    reviews.forEach(review => {
      if (review.rating !== null) {
        const rating = Math.floor(review.rating);
        distribution.set(rating, (distribution.get(rating) || 0) + 1);
      }
    });

    return Array.from(distribution.entries())
      .map(([rating, count]): RatingDistribution => ({
        rating,
        count
      }))
      .sort((a, b) => a.rating - b.rating);
  }, [reviews]);

  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    const validReviews = reviews.filter(review => review.rating !== null);
    if (validReviews.length === 0) return 0;
    return validReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / validReviews.length;
  }, [reviews]);

  return {
    restaurantStats,
    ratingDistribution,
    totalReviews,
    averageRating
  };
} 