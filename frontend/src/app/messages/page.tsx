import React from 'react';
import { Messaging } from '@/components/common/Messaging';

export default function MessagesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <Messaging />
    </div>
  );
} 