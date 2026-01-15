import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useShoppingList } from '../hooks/useShoppingList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
  isPantryStaple?: boolean;
}

interface VariationTip {
  day: number;
  suggestion: string;
  extraIngredients?: string[];
}

interface OfferMatch {
  ingredient: Ingredient;
  offer: {
    store: string;
    productName: string;
    offerPrice: number;
    discountPercentage: number;
  };
  savings: number;
}

interface MatchedRecipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  batchCookingScore: number;
  freezerFriendly: boolean;
  fridgeLifeDays: number;
  freezerLifeMonths: number;
  ingredients: Ingredient[];
  instructions: string[];
  variationTips: VariationTip[];
  tags: string[];
  matchPercentage: number;
  matchedOffers: OfferMatch[];
  totalSavings: number;
  estimatedTotalCost: number;
  estimatedCostPerServing?: number;
}

function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: recipe, loading, error, refetch } = useApi<MatchedRecipe>(`/recipes/${id}`);
  const { addRecipe, isInList, removeRecipe } = useShoppingList();
  const [servingMultiplier, setServingMultiplier] = useState(1);

  if (loading) return <LoadingSpinner message="Recept laden..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!recipe) return <ErrorMessage message="Recept niet gevonden" />;

  const adjustedServings = recipe.servings * servingMultiplier;
  const totalTime = recipe.prepTime + recipe.cookTime;
  const inList = isInList(recipe.id);

  const formatAmount = (amount: number) => {
    const adjusted = amount * servingMultiplier;
    return adjusted % 1 === 0 ? adjusted.toString() : adjusted.toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/recepten" className="text-emerald-600 hover:text-emerald-700">
          ← Terug naar recepten
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        {recipe.matchPercentage > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 flex items-center justify-between">
            <span className="font-medium">
              {recipe.matchPercentage}% van de ingredienten in de aanbieding!
            </span>
            {recipe.totalSavings > 0 && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                Bespaar €{recipe.totalSavings.toFixed(2)}
              </span>
            )}
          </div>
        )}

        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{recipe.name}</h1>
          <p className="text-lg text-gray-600 mb-6">{recipe.description}</p>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <span>⏱️</span>
              <div>
                <div className="text-sm font-medium">{totalTime} min</div>
                <div className="text-xs text-gray-500">
                  {recipe.prepTime} min voorbereiding + {recipe.cookTime} min koken
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <span>👥</span>
              <div>
                <div className="text-sm font-medium">{adjustedServings} porties</div>
                <div className="text-xs text-gray-500">Schaal aan met de knoppen</div>
              </div>
            </div>
            {recipe.freezerFriendly && (
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg">
                <span>❄️</span>
                <div>
                  <div className="text-sm font-medium">Vriesvriendelijk</div>
                  <div className="text-xs text-gray-500">Tot {recipe.freezerLifeMonths} maanden</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
              <span>🌡️</span>
              <div>
                <div className="text-sm font-medium">Koelkast</div>
                <div className="text-xs text-gray-500">{recipe.fridgeLifeDays} dagen houdbaar</div>
              </div>
            </div>
            {recipe.estimatedCostPerServing && (
              <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-lg">
                <span>💰</span>
                <div>
                  <div className="text-sm font-medium">€{(recipe.estimatedCostPerServing * servingMultiplier).toFixed(2)}/portie</div>
                  <div className="text-xs text-gray-500">Geschatte kosten</div>
                </div>
              </div>
            )}
          </div>

          {/* Batch Cooking Score */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-gray-600">Batch cooking score:</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xl ${
                    i < recipe.batchCookingScore ? 'text-amber-400' : 'text-gray-200'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map(tag => (
              <span key={tag} className="badge-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredienten</h2>

            {/* Serving adjuster */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
              <button
                onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
              >
                −
              </button>
              <span className="flex-1 text-center font-medium">
                {adjustedServings} porties
              </span>
              <button
                onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
              >
                +
              </button>
            </div>

            {/* Ingredient list */}
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => {
                const offer = recipe.matchedOffers.find(
                  m => m.ingredient.name === ingredient.name
                );

                return (
                  <li
                    key={index}
                    className={`flex justify-between items-start ${
                      ingredient.isPantryStaple ? 'text-gray-400' : ''
                    }`}
                  >
                    <span className="flex-1">
                      {ingredient.name}
                      {ingredient.isPantryStaple && (
                        <span className="text-xs ml-1">(voorraad)</span>
                      )}
                    </span>
                    <span className="text-gray-500 text-right">
                      {formatAmount(ingredient.amount)} {ingredient.unit}
                    </span>
                    {offer && (
                      <span className="ml-2 badge-offer text-xs">
                        -{offer.offer.discountPercentage}%
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Add to shopping list */}
            <button
              onClick={() => {
                if (inList) {
                  removeRecipe(recipe.id);
                } else {
                  addRecipe(recipe.id, recipe.name, adjustedServings);
                }
              }}
              className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
                inList
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {inList ? '✓ In boodschappenlijst' : 'Toevoegen aan boodschappenlijst'}
            </button>
          </div>
        </div>

        {/* Instructions and Variations */}
        <div className="md:col-span-2 space-y-8">
          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bereiding</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 pt-1">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Variation Tips */}
          {recipe.variationTips.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔄 Variatie tips voor de week
              </h2>
              <p className="text-gray-600 mb-4">
                Zo maak je van hetzelfde gerecht meerdere verschillende maaltijden:
              </p>
              <div className="space-y-3">
                {recipe.variationTips.map((tip, index) => (
                  <div key={index} className="bg-white rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-medium text-sm">
                        Dag {tip.day}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{tip.suggestion}</p>
                        {tip.extraIngredients && tip.extraIngredients.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Extra nodig: {tip.extraIngredients.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Offers */}
          {recipe.matchedOffers.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🏷️ Ingredienten in de aanbieding
              </h2>
              <div className="space-y-3">
                {recipe.matchedOffers.map((match, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{match.offer.productName}</p>
                      <p className="text-sm text-gray-500 capitalize">{match.offer.store.replace('-', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="badge-offer">-{match.offer.discountPercentage}%</div>
                      <p className="text-sm text-emerald-600 font-medium mt-1">
                        €{match.offer.offerPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetailPage;
