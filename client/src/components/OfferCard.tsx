interface Offer {
  id: string;
  store: 'albert-heijn' | 'jumbo';
  productName: string;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  category: string;
  unit: string;
  validUntil: string;
}

interface OfferCardProps {
  offer: Offer;
}

function OfferCard({ offer }: OfferCardProps) {
  const storeColors = {
    'albert-heijn': 'border-l-ah-blue bg-blue-50/50',
    'jumbo': 'border-l-jumbo-yellow bg-yellow-50/50',
  };

  const storeNames = {
    'albert-heijn': 'Albert Heijn',
    'jumbo': 'Jumbo',
  };

  const validDate = new Date(offer.validUntil);
  const daysLeft = Math.ceil((validDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`card border-l-4 ${storeColors[offer.store]}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">{storeNames[offer.store]}</p>
            <h3 className="font-medium text-gray-900 truncate">{offer.productName}</h3>
            <p className="text-sm text-gray-500">{offer.unit}</p>
          </div>

          <div className="text-right ml-4">
            <div className="badge-savings mb-1">-{offer.discountPercentage}%</div>
            <div className="text-lg font-bold text-emerald-600">
              €{offer.offerPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 line-through">
              €{offer.originalPrice.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
          <span className="text-gray-500 capitalize">{offer.category}</span>
          <span className={`${daysLeft <= 2 ? 'text-orange-600' : 'text-gray-500'}`}>
            {daysLeft <= 0 ? 'Laatste dag!' : `Nog ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'}`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default OfferCard;
