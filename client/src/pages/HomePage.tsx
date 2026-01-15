import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useShoppingList } from '../hooks/useShoppingList';
import RecipeCard from '../components/RecipeCard';
import OfferCard from '../components/OfferCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface MatchedRecipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  batchCookingScore: number;
  freezerFriendly: boolean;
  tags: string[];
  matchPercentage: number;
  totalSavings: number;
  estimatedCostPerServing?: number;
}

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

function HomePage() {
  const { data: topRecipes, loading: recipesLoading, error: recipesError } = useApi<MatchedRecipe[]>('/recipes/top-matches?limit=6');
  const { data: offers, loading: offersLoading, error: offersError } = useApi<Offer[]>('/offers');
  const { addRecipe, isInList } = useShoppingList();

  const loading = recipesLoading || offersLoading;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Bespaar op je boodschappen
        </h1>
        <p className="text-lg text-emerald-100 mb-6 max-w-2xl">
          Ontdek recepten die gebruikmaken van producten in de aanbieding bij Albert Heijn en Jumbo.
          Perfect voor batch cooking en meal prep!
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/recepten" className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
            Bekijk alle recepten
          </Link>
          <Link to="/tips" className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-400 transition-colors">
            Batch cooking tips
          </Link>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">🛒</div>
          <div className="text-2xl font-bold text-gray-900">{offers?.length || 0}</div>
          <div className="text-sm text-gray-500">Aanbiedingen</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">📖</div>
          <div className="text-2xl font-bold text-gray-900">{topRecipes?.length ? '20+' : '0'}</div>
          <div className="text-sm text-gray-500">Recepten</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">❄️</div>
          <div className="text-2xl font-bold text-gray-900">15+</div>
          <div className="text-sm text-gray-500">Vriesvriendelijk</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl mb-1">💰</div>
          <div className="text-2xl font-bold text-emerald-600">€2-4</div>
          <div className="text-sm text-gray-500">Per portie</div>
        </div>
      </section>

      {/* Top Matching Recipes */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top recepten deze week</h2>
            <p className="text-gray-600">Recepten met de meeste ingredienten in de aanbieding</p>
          </div>
          <Link to="/recepten" className="btn-secondary hidden md:inline-block">
            Bekijk alle
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Recepten laden..." />
        ) : recipesError ? (
          <ErrorMessage message={recipesError} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRecipes?.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onAddToList={addRecipe}
                isInList={isInList(recipe.id)}
              />
            ))}
          </div>
        )}

        <Link to="/recepten" className="btn-secondary w-full mt-6 text-center block md:hidden">
          Bekijk alle recepten
        </Link>
      </section>

      {/* Current Offers */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Huidige aanbiedingen</h2>
            <p className="text-gray-600">Beste deals bij Albert Heijn en Jumbo</p>
          </div>
          <Link to="/aanbiedingen" className="btn-secondary hidden md:inline-block">
            Bekijk alle
          </Link>
        </div>

        {offersLoading ? (
          <LoadingSpinner message="Aanbiedingen laden..." />
        ) : offersError ? (
          <ErrorMessage message={offersError} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers?.slice(0, 8).map(offer => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}

        <Link to="/aanbiedingen" className="btn-secondary w-full mt-6 text-center block md:hidden">
          Bekijk alle aanbiedingen
        </Link>
      </section>

      {/* Batch Cooking Tips Preview */}
      <section className="bg-amber-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Batch Cooking Tips</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-semibold mb-1">Maak grote porties</h3>
            <p className="text-sm text-gray-600">
              Kook 6-8 porties tegelijk en vries de rest in voor later.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="font-semibold mb-1">Varieer je maaltijden</h3>
            <p className="text-sm text-gray-600">
              Gebruik dezelfde basis op verschillende manieren door de week.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">🏷️</div>
            <h3 className="font-semibold mb-1">Label en dateer</h3>
            <p className="text-sm text-gray-600">
              Schrijf altijd de datum op je ingevroren maaltijden.
            </p>
          </div>
        </div>
        <Link to="/tips" className="inline-block mt-6 text-emerald-600 font-medium hover:text-emerald-700">
          Meer batch cooking tips →
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
