import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
    </div>
  );
}
