import { useCartStore } from '@/lib/stores/use-cart-store';
import { formatCurrency } from '@/utils/format';

export function CartSummary() {
  const { items, getTotal, getItemCount, getEnvironmentalImpact, clearCart } = useCartStore();
  const total = getTotal();
  const itemCount = getItemCount();
  const impact = getEnvironmentalImpact();

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cart Summary</h2>
      
      <div className="space-y-4 mb-6">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center"> {/* Accessing item.id directly */}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {item.title} {/* Accessing title directly from CartItem */}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Quantity: {item.quantity}
              </p>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(item.price * item.quantity)} {/* Accessing price directly from CartItem */}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Items</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{itemCount}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          Environmental Impact
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-green-700 dark:text-green-300">CO2 Saved</span>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              {impact.co2Saved.toFixed(1)}kg
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-green-700 dark:text-green-300">E-waste Diverted</span>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              {impact.eWasteDiverted.toFixed(1)}kg
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => {/* TODO: Implement checkout */}}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
        >
          Proceed to Checkout
        </button>
        <button
          onClick={clearCart}
          className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}