import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingInputProps {
  value: number;           // Add this
  onChange: (rating: number) => void; // Add this
  size?: number;
}

export default function StarRatingInput({ value, onChange, size = 24 }: StarRatingInputProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={size}
            className={`${
              star <= value ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}