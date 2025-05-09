import React from 'react';

export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="text-red-500 text-center py-4">{message}</div>
  );
}
