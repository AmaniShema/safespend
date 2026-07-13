import { useState, useEffect, useCallback } from 'react';
import type { ShoppingList, ShoppingItem } from '../db/shoppingList';
import {
  getAllShoppingLists, createShoppingList, deleteShoppingList, updateShoppingListStatus,
  getItemsByList, addShoppingItem, markItemBought, markItemSkipped,
  resetItemToPending, deleteShoppingItem, initShoppingTables,
} from '../db/shoppingList';

interface UseShoppingListReturn {
  lists: ShoppingList[];
  isLoading: boolean;
  createList: (data: Omit<ShoppingList, 'id' | 'createdAt' | 'status'>) => Promise<ShoppingList>;
  removeList: (id: string) => Promise<void>;
  completeList: (id: string) => Promise<void>;
  getItems: (listId: string) => Promise<ShoppingItem[]>;
  addItem: (data: Omit<ShoppingItem, 'id' | 'createdAt' | 'status' | 'actualAmount' | 'skipReason'>) => Promise<ShoppingItem>;
  buyItem: (id: string, actualAmount: number) => Promise<void>;
  skipItem: (id: string, reason: string) => Promise<void>;
  resetItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useShoppingList = (): UseShoppingListReturn => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initShoppingTables();
      setLists(await getAllShoppingLists());
    } catch (err) {
      console.error('Shopping list error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createList = async (data: Omit<ShoppingList, 'id' | 'createdAt' | 'status'>): Promise<ShoppingList> => {
    const list = await createShoppingList(data);
    await refresh();
    return list;
  };

  const removeList = async (id: string): Promise<void> => {
    await deleteShoppingList(id);
    await refresh();
  };

  const completeList = async (id: string): Promise<void> => {
    await updateShoppingListStatus(id, 'completed');
    await refresh();
  };

  const getItems = async (listId: string): Promise<ShoppingItem[]> => {
    return getItemsByList(listId);
  };

  const addItem = async (data: Omit<ShoppingItem, 'id' | 'createdAt' | 'status' | 'actualAmount' | 'skipReason'>): Promise<ShoppingItem> => {
    return addShoppingItem(data);
  };

  const buyItem = async (id: string, actualAmount: number): Promise<void> => {
    await markItemBought(id, actualAmount);
  };

  const skipItem = async (id: string, reason: string): Promise<void> => {
    await markItemSkipped(id, reason);
  };

  const resetItem = async (id: string): Promise<void> => {
    await resetItemToPending(id);
  };

  const removeItem = async (id: string): Promise<void> => {
    await deleteShoppingItem(id);
  };

  return { lists, isLoading, createList, removeList, completeList, getItems, addItem, buyItem, skipItem, resetItem, removeItem, refresh };
};
