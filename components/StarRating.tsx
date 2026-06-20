interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export default function StarRating({ rating, reviewCount, size = 14 }: StarRatingProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{ display: "flex", gap: "1px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= rating ? "#ffc107" : "none"}
            stroke={star <= rating ? "#ffc107" : "#d0d0d0"}
            strokeWidth="1.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span style={{ fontSize: "12px", color: "#888" }}>({reviewCount})</span>
      )}
    </div>
  );
}
