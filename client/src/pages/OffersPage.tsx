import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import OfferCard from '../components/OfferCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface Offer {
  id: string;
  store: 'albert-heijn' | 'jumbo';
  productName: string;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  category: string;
  unit: string;
  validFrom: string;
  validUntil: string;
}

type StoreFilter = 'all' | 'albert-heijn' | 'jumbo';

function OffersPage() {
  const [storeFilter, setStoreFilter] = useState<StoreFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: offers, loading, error, refetch } = useApi<Offer[]>('/offers');

  const categories = offers
    ? [...new Set(offers.map(o => o.category))].sort()
    : [];

  const filteredOffers = offers?.filter(offer => {
    if (storeFilter !== 'all' && offer.store !== storeFilter) return false;
    if (categoryFilter !== 'all' && offer.category !== categoryFilter) return false;
    if (searchQuery && !offer.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const ahCount = offers?.filter(o => o.store === 'albert-heijn').length || 0;
  const jumboCount = offers?.filter(o => o.store === 'jumbo').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Aanbiedingen</h1>
        <p className="text-gray-600 mt-2">
          Actuele aanbiedingen bij Albert Heijn en Jumbo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setStoreFilter('all')}
          className={`card p-4 text-center transition-all ${
            storeFilter === 'all' ? 'ring-2 ring-emerald-500' : ''
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">{offers?.length || 0}</div>
          <div className="text-sm text-gray-500">Totaal</div>
        </button>
        <button
          onClick={() => setStoreFilter('albert-heijn')}
          className={`card p-4 text-center transition-all border-l-4 border-l-ah-blue ${
            storeFilter === 'albert-heijn' ? 'ring-2 ring-ah-blue' : ''
          }`}
        >
          <div className="text-2xl font-bold text-ah-blue">{ahCount}</div>
          <div className="text-sm text-gray-500">Albert Heijn</div>
        </button>
        <button
          onClick={() => setStoreFilter('jumbo')}
          className={`card p-4 text-center transition-all border-l-4 border-l-jumbo-yellow ${
            storeFilter === 'jumbo' ? 'ring-2 ring-amber-500' : ''
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">{jumboCount}</div>
          <div className="text-sm text-gray-500">Jumbo</div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Zoek producten..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Alle categorieen
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              categoryFilter === category
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner message="Aanbiedingen laden..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : filteredOffers && filteredOffers.length > 0 ? (
        <>
          <p className="text-gray-500">
            {filteredOffers.length} {filteredOffers.length === 1 ? 'aanbieding' : 'aanbiedingen'} gevonden
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen aanbiedingen gevonden</h3>
          <p className="text-gray-500">Probeer een andere zoekterm of filter</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStoreFilter('all');
              setCategoryFilter('all');
            }}
            className="btn-secondary mt-4"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

export default OffersPage;
