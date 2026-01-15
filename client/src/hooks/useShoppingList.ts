import { useState, useEffect, useCallback } from 'react';

interface ShoppingListItem {
  recipeId: string;
  recipeName: string;
  servings: number;
}

const STORAGE_KEY = 'budget-recipes-shopping-list';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addRecipe = useCallback((recipeId: string, recipeName: string, servings: number) => {
    setItems(prev => {
      const existing = prev.find(item => item.recipeId === recipeId);
      if (existing) {
        return prev.map(item =>
          item.recipeId === recipeId
            ? { ...item, servings: item.servings + servings }
            : item
        );
      }
      return [...prev, { recipeId, recipeName, servings }];
    });
  }, []);

  const removeRecipe = useCallback((recipeId: string) => {
    setItems(prev => prev.filter(item => item.recipeId !== recipeId));
  }, []);

  const updateServings = useCallback((recipeId: string, servings: number) => {
    setItems(prev =>
      prev.map(item =>
        item.recipeId === recipeId ? { ...item, servings } : item
      )
    );
  }, []);

  const clearList = useCallback(() => {
    setItems([]);
  }, []);

  const isInList = useCallback((recipeId: string) => {
    return items.some(item => item.recipeId === recipeId);
  }, [items]);

  return {
    items,
    addRecipe,
    removeRecipe,
    updateServings,
    clearList,
    isInList,
    itemCount: items.length,
  };
}
