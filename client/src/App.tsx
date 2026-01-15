import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import OffersPage from './pages/OffersPage';
import ShoppingListPage from './pages/ShoppingListPage';
import TipsPage from './pages/TipsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="recepten" element={<RecipesPage />} />
        <Route path="recepten/:id" element={<RecipeDetailPage />} />
        <Route path="aanbiedingen" element={<OffersPage />} />
        <Route path="boodschappenlijst" element={<ShoppingListPage />} />
        <Route path="tips" element={<TipsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
