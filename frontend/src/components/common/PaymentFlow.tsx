import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

interface PaymentFlowProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  amount,
  orderId,
  onSuccess,
  onCancel,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/mpesa/stk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
          orderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment initiated. Please check your phone for the STK push.');
        // Poll for payment status
        pollPaymentStatus(orderId);
      } else {
        toast.error(data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      toast.error('An error occurred while processing payment');
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (orderId: string) => {
    const maxAttempts = 10;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${orderId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          toast.success('Payment successful!');
          onSuccess();
          return;
        }

        if (data.status === 'failed') {
          toast.error('Payment failed. Please try again.');
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    };

    checkStatus();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
      <div className="mb-6">
        <p className="text-gray-600">Amount to pay:</p>
        <p className="text-2xl font-bold">KES {amount.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            M-Pesa Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="254XXXXXXXXX"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
            pattern="254[0-9]{9}"
          />
          <p className="mt-1 text-sm text-gray-500">Format: 254XXXXXXXXX</p>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Pay Now'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Payment Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
          <li>Enter your M-Pesa registered phone number</li>
          <li>Click "Pay Now" to receive the payment prompt</li>
          <li>Enter your M-Pesa PIN on your phone</li>
          <li>Wait for confirmation message</li>
        </ol>
      </div>
    </div>
  );
}; 