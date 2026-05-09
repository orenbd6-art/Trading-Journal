'use client';
import { TradeForm } from '../../../components/TradeForm/TradeForm';

export default function NewTradePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add New Trade</h1>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-4xl">
        <TradeForm />
      </div>
    </div>
  );
}