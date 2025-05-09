import type { Review } from './types/Review';
import { useStats } from './hooks/useStats';
import { restaurantDisplay } from './components/ReviewCard';

interface StatsProps {
  reviews: Review[];
}

function getRatingColor(rating: number) {
  if (rating >= 9.5) return 'text-yellow-300 drop-shadow-[0_0_6px_gold]';
  // Linear interpolate from red (1.0) to muted green (9.0)
  const min = 1, max = 9;
  const clamped = Math.max(min, Math.min(max, rating));
  const percent = (clamped - min) / (max - min);
  // Red to muted green: hsl(0,100%,50%) to hsl(120,60%,38%)
  const hue = 0 + percent * 120;
  const sat = 100 - percent * 40; // 100% to 60%
  const light = 50 - percent * 12; // 50% to 38%
  return `text-[hsl(${hue},${sat}%,${light}%)]`;
}

export default function Stats({ reviews }: StatsProps) {
  const { restaurantStats, ratingDistribution, totalReviews, averageRating } = useStats(reviews);

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">Total Reviews</h2>
          <p className="text-3xl font-bold">{totalReviews}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">Average Rating</h2>
          <p className={`text-3xl font-bold ${getRatingColor(averageRating)}`}>
            {averageRating.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Top 10 Restaurants */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Top 10 Most Reviewed Restaurants</h2>
        <div className="space-y-4">
          {restaurantStats.map(({ restaurant, display, count, averageRating }) => {
            const { logo } = restaurantDisplay[restaurant] || { logo: 'other' };
            return (
              <div key={restaurant} className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0 bg-gray-700 rounded-md flex items-center justify-center p-2" title={display}>
                  <img
                    src={`/logos/${logo}.svg`}
                    alt={`${display} logo`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(count / restaurantStats[0].count) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="text-gray-400">{count} reviews</span>
                  <br />
                  <span className={getRatingColor(averageRating)}>
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Rating Distribution</h2>
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-4">
              <div className="w-12 text-right">{rating}</div>
              <div className="flex-1">
                <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(count / Math.max(...ratingDistribution.map(d => d.count))) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-gray-400">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}