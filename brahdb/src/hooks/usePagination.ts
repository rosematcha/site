import { useMemo } from 'react';
import type { Review } from '../types/Review';
import { REVIEWS_PER_PAGE } from './useReviews';

export function usePagination(reviews: Review[], currentPage: number) {
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    const endIndex = startIndex + REVIEWS_PER_PAGE;
    return reviews.slice(startIndex, endIndex);
  }, [reviews, currentPage]);

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);

  return {
    paginatedReviews,
    totalPages,
  };
} 