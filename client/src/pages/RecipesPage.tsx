import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useShoppingList } from '../hooks/useShoppingList';
import RecipeCard from '../components/RecipeCard';
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

type FilterType = 'all' | 'top-matches' | 'batch-friendly' | 'freezer-friendly' | 'cheapest';

function RecipesPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { addRecipe, isInList } = useShoppingList();

  const endpoint = filter === 'all' ? '/recipes' :
    filter === 'top-matches' ? '/recipes/top-matches' :
    filter === 'batch-friendly' ? '/recipes/batch-friendly' :
    filter === 'freezer-friendly' ? '/recipes/freezer-friendly' :
    '/recipes/cheapest';

  const { data: recipes, loading, error, refetch } = useApi<MatchedRecipe[]>(endpoint);
  const { data: tags } = useApi<string[]>('/recipes/tags');

  const filteredRecipes = recipes?.filter(recipe =>
    searchQuery === '' ||
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filterOptions: { value: FilterType; label: string; icon: string }[] = [
    { value: 'all', label: 'Alle recepten', icon: '📖' },
    { value: 'top-matches', label: 'Beste matches', icon: '🎯' },
    { value: 'batch-friendly', label: 'Batch cooking', icon: '📦' },
    { value: 'freezer-friendly', label: 'Vriesvriendelijk', icon: '❄️' },
    { value: 'cheapest', label: 'Goedkoopst', icon: '💰' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recepten</h1>
        <p className="text-gray-600 mt-2">
          Ontdek budgetvriendelijke recepten perfect voor batch cooking
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Zoek recepten..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === option.value
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className={`badge-tag cursor-pointer hover:bg-blue-200 ${
                searchQuery === tag ? 'bg-blue-200' : ''
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <LoadingSpinner message="Recepten laden..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : filteredRecipes && filteredRecipes.length > 0 ? (
        <>
          <p className="text-gray-500">
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recept' : 'recepten'} gevonden
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onAddToList={addRecipe}
                isInList={isInList(recipe.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🍳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen recepten gevonden</h3>
          <p className="text-gray-500">Probeer een andere zoekterm of filter</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilter('all');
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

export default RecipesPage;
