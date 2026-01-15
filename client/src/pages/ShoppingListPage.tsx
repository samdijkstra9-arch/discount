import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShoppingList } from '../hooks/useShoppingList';
import { postApi } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

interface ShoppingListItem {
  ingredient: {
    name: string;
    amount: number;
    unit: string;
    category: string;
  };
  recipe: string;
  offer?: {
    store: string;
    productName: string;
    offerPrice: number;
    discountPercentage: number;
  };
  estimatedPrice: number;
  isOnOffer: boolean;
}

interface ShoppingListData {
  items: ShoppingListItem[];
  totalEstimatedCost: number;
  totalSavings: number;
  stores: {
    store: string;
    items: ShoppingListItem[];
    subtotal: number;
  }[];
}

function ShoppingListPage() {
  const { items, removeRecipe, updateServings, clearList, itemCount } = useShoppingList();
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setShoppingList(null);
      return;
    }

    const fetchShoppingList = async () => {
      setLoading(true);
      const result = await postApi<{ recipes: { id: string; servings: number }[] }, ShoppingListData>(
        '/recipes/shopping-list',
        { recipes: items.map(item => ({ id: item.recipeId, servings: item.servings })) }
      );
      setShoppingList(result);
      setLoading(false);
    };

    fetchShoppingList();
  }, [items]);

  if (itemCount === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">🛒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Je boodschappenlijst is leeg</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Voeg recepten toe aan je boodschappenlijst om een overzicht te krijgen van alle
          ingredienten die je nodig hebt.
        </p>
        <Link to="/recepten" className="btn-primary">
          Bekijk recepten
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boodschappenlijst</h1>
          <p className="text-gray-600 mt-2">
            Overzicht van alle ingredienten voor je geselecteerde recepten
          </p>
        </div>
        <button
          onClick={clearList}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Lijst wissen
        </button>
      </div>

      {/* Selected Recipes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Geselecteerde recepten</h2>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.recipeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Link
                  to={`/recepten/${item.recipeId}`}
                  className="font-medium text-gray-900 hover:text-emerald-600"
                >
                  {item.recipeName}
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateServings(item.recipeId, Math.max(1, item.servings - 1))}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-16 text-center text-sm">
                    {item.servings} porties
                  </span>
                  <button
                    onClick={() => updateServings(item.recipeId, item.servings + 1)}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeRecipe(item.recipeId)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Boodschappenlijst berekenen..." />
      ) : shoppingList ? (
        <>
          {/* Cost Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-gray-900">
                €{shoppingList.totalEstimatedCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Geschatte totaalkosten</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600">
                €{shoppingList.totalSavings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Besparing met aanbiedingen</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {shoppingList.items.length}
              </div>
              <div className="text-sm text-gray-500">Ingredienten</div>
            </div>
          </div>

          {/* Items by Store */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Albert Heijn */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-ah-blue text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold">Albert Heijn</h3>
                <span className="text-blue-100">
                  {shoppingList.stores.find(s => s.store === 'albert-heijn')?.items.length || 0} items
                </span>
              </div>
              <div className="p-4">
                {shoppingList.stores.find(s => s.store === 'albert-heijn')?.items.length ? (
                  <ul className="space-y-2">
                    {shoppingList.stores
                      .find(s => s.store === 'albert-heijn')
                      ?.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <span className="font-medium">{item.ingredient.name}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              {item.ingredient.amount} {item.ingredient.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="badge-offer text-xs">
                              -{item.offer?.discountPercentage}%
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Geen items in de aanbieding bij Albert Heijn
                  </p>
                )}
              </div>
            </div>

            {/* Jumbo */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-jumbo-yellow text-black px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold">Jumbo</h3>
                <span className="text-yellow-800">
                  {shoppingList.stores.find(s => s.store === 'jumbo')?.items.length || 0} items
                </span>
              </div>
              <div className="p-4">
                {shoppingList.stores.find(s => s.store === 'jumbo')?.items.length ? (
                  <ul className="space-y-2">
                    {shoppingList.stores
                      .find(s => s.store === 'jumbo')
                      ?.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <span className="font-medium">{item.ingredient.name}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              {item.ingredient.amount} {item.ingredient.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="badge-offer text-xs">
                              -{item.offer?.discountPercentage}%
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Geen items in de aanbieding bij Jumbo
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Full Shopping List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Complete boodschappenlijst</h3>
              <button
                onClick={() => {
                  const text = shoppingList.items
                    .map(item => `- ${item.ingredient.name}: ${item.ingredient.amount} ${item.ingredient.unit}`)
                    .join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Kopieer naar klembord
              </button>
            </div>
            <div className="p-6">
              <ul className="space-y-2">
                {shoppingList.items.map((item, index) => (
                  <li
                    key={index}
                    className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${
                      item.isOnOffer ? 'bg-emerald-50 -mx-2 px-2 rounded' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded text-emerald-600" />
                      <div>
                        <span className="font-medium">{item.ingredient.name}</span>
                        <span className="text-gray-400 text-xs ml-2 capitalize">
                          ({item.ingredient.category})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">
                        {item.ingredient.amount} {item.ingredient.unit}
                      </span>
                      {item.isOnOffer && (
                        <span className="badge-offer text-xs">Aanbieding!</span>
                      )}
                      <span className="text-gray-500 w-16 text-right">
                        €{item.estimatedPrice.toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default ShoppingListPage;
