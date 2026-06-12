import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../types';
import { getAllCategories, createCategory, updateCategory, deleteCategory, initCategories } from '../db/categories';

interface UseCategoriesReturn {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  isLoading: boolean;
  addCategory: (data: Omit<Category, 'id' | 'createdAt' | 'isSystem' | 'isDaily'>) => Promise<void>;
  editCategory: (id: string, data: { name: string; emoji: string; color: string }) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initCategories();
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Categories error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCategory = async (
    data: Omit<Category, 'id' | 'createdAt' | 'isSystem' | 'isDaily'>
  ): Promise<void> => {
    await createCategory(data);
    await refresh();
  };

  const editCategory = async (id: string, data: { name: string; emoji: string; color: string }): Promise<void> => {
    await updateCategory(id, data);
    await refresh();
  };

  const removeCategory = async (id: string): Promise<void> => {
    await deleteCategory(id);
    await refresh();
  };

  const expenseCategories = categories.filter((c) => c.id !== 'salary');
  const incomeCategories = categories.filter((c) =>
    ['salary', 'daily'].includes(c.id) || !c.isSystem
  );

  return {
    categories,
    expenseCategories,
    incomeCategories,
    isLoading,
    editCategory,
    addCategory,
    removeCategory,
    refresh,
  };
};
