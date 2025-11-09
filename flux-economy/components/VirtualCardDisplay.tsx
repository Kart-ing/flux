"use client";

import React, { useState, useEffect } from 'react';
import { VirtualCard } from '@/types';
import { CreditCard, Clock, Check, X, Ban } from 'lucide-react';

interface VirtualCardDisplayProps {
  card: VirtualCard;
  showFullDetails?: boolean;
}

export default function VirtualCardDisplay({ card, showFullDetails = false }: VirtualCardDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Calculate time remaining for active cards
  useEffect(() => {
    if (card.status !== 'active') return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(card.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [card.expiresAt, card.status]);

  // Status badge styles
  const getStatusBadge = () => {
    switch (card.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
            <Clock className="w-3 h-3" />
            Active · {timeRemaining}
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-medium">
            <Check className="w-3 h-3" />
            Used
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
            <X className="w-3 h-3" />
            Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
            <Ban className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // Mask card number for compact view
  const maskedCardNumber = `**** **** **** ${card.cardNumber.slice(-4)}`;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">{card.purpose || 'Virtual Card'}</span>
        </div>
        {getStatusBadge()}
      </div>

      {showFullDetails && card.status === 'active' ? (
        <>
          {/* Full card details for active cards */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-4 mb-3 text-white">
            <div className="mb-4">
              <div className="text-xs opacity-80 mb-1">Card Number</div>
              <div className="font-mono text-lg tracking-wider">
                {card.cardNumber.match(/.{1,4}/g)?.join(' ')}
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>
                <div className="text-xs opacity-80">CVV</div>
                <div className="font-mono text-sm">{card.cvv}</div>
              </div>
              <div>
                <div className="text-xs opacity-80">Expiry</div>
                <div className="font-mono text-sm">{card.expiryDate}</div>
              </div>
              <div>
                <div className="text-xs opacity-80">Cardholder</div>
                <div className="text-sm">{card.cardHolderName}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Limit</div>
              <div className="text-gray-200 font-medium">
                ${(card.amountLimit / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Expires At</div>
              <div className="text-gray-200 font-medium">
                {new Date(card.expiresAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Compact view for used/expired cards */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Card</span>
              <span className="text-gray-200 font-mono">{maskedCardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Limit</span>
              <span className="text-gray-200">${(card.amountLimit / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-200">
                {new Date(card.createdAt).toLocaleDateString()}
              </span>
            </div>
            {card.usedAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Used At</span>
                <span className="text-gray-200">
                  {new Date(card.usedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
