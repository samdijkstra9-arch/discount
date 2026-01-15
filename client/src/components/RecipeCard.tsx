import { Link } from 'react-router-dom';

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

interface RecipeCardProps {
  recipe: MatchedRecipe;
  onAddToList?: (id: string, name: string, servings: number) => void;
  isInList?: boolean;
}

function RecipeCard({ recipe, onAddToList, isInList }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Match indicator */}
      {recipe.matchPercentage > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
          <span>{recipe.matchPercentage}% ingredienten in de aanbieding</span>
          {recipe.totalSavings > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded">
              Bespaar €{recipe.totalSavings.toFixed(2)}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <Link to={`/recepten/${recipe.id}`} className="block">
            <h3 className="font-semibold text-lg text-gray-900 hover:text-emerald-600 transition-colors">
              {recipe.name}
            </h3>
          </Link>

          {/* Batch cooking score */}
          <div className="flex items-center space-x-1" title="Batch cooking score">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-sm ${
                  i < recipe.batchCookingScore ? 'text-amber-400' : 'text-gray-200'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center">
            <span className="mr-1">⏱️</span>
            {totalTime} min
          </span>
          <span className="flex items-center">
            <span className="mr-1">👥</span>
            {recipe.servings} porties
          </span>
          {recipe.freezerFriendly && (
            <span className="flex items-center text-blue-600">
              <span className="mr-1">❄️</span>
              Vriesvriendelijk
            </span>
          )}
          {recipe.estimatedCostPerServing && (
            <span className="flex items-center text-emerald-600 font-medium">
              <span className="mr-1">💰</span>
              €{recipe.estimatedCostPerServing.toFixed(2)}/portie
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags.slice(0, 4).map(tag => (
            <span key={tag} className="badge-tag">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/recepten/${recipe.id}`}
            className="flex-1 btn-primary text-center text-sm"
          >
            Bekijk recept
          </Link>
          {onAddToList && (
            <button
              onClick={() => onAddToList(recipe.id, recipe.name, recipe.servings)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isInList
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isInList ? 'Al in boodschappenlijst' : 'Toevoegen aan boodschappenlijst'}
            >
              {isInList ? '✓' : '+'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeCard;
