type ItemId = string;

interface Item {
  id: ItemId;
  name: string;
}

interface PagedResult<T> {
  items: T[];
  total: number;
}

interface StoreState {
  selectedOrder: ItemId[];
  selectedIds: ItemId[];
}

class Store {
  private allItems: Map<ItemId, Item>;
  private allIds: ItemId[];

  private selectedItems: Map<ItemId, Item>;
  private selectedSet: Set<ItemId>;
  private selectedOrder: ItemId[];

  private prefixIndex: Map<string, ItemId[]>;
  private charIndex: Map<string, ItemId[]>;

  private nextId: number;

  constructor() {
    this.allItems = new Map();
    this.allIds = [];

    this.selectedItems = new Map();
    this.selectedSet = new Set();
    this.selectedOrder = [];

    this.prefixIndex = new Map();
    this.charIndex = new Map();

    this.nextId = 1000001;
  }

  initialize(): void {
    for (let i = 1; i <= 1000000; i++) {
      const id = String(i);
      const item = { id, name: `Item ${id}` };

      this.allItems.set(id, item);
      this.allIds.push(id);

      const key = id.slice(0, 2);
      if (!this.prefixIndex.has(key)) {
        this.prefixIndex.set(key, []);
      }
      this.prefixIndex.get(key)!.push(id);

      const char = id[0];
      if (!this.charIndex.has(char)) {
        this.charIndex.set(char, []);
      }
      this.charIndex.get(char)!.push(id);
    }
  }

  addItem(id: ItemId | number): boolean {
    const strId = String(id);

    if (this.allItems.has(strId)) return false;

    const item = { id: strId, name: `Item ${strId}` };

    this.allItems.set(strId, item);
    this.allIds.push(strId);

    const key = strId.slice(0, 2);
    if (!this.prefixIndex.has(key)) {
      this.prefixIndex.set(key, []);
    }
    this.prefixIndex.get(key)!.push(strId);

    const char = strId[0];
    if (!this.charIndex.has(char)) {
      this.charIndex.set(char, []);
    }
    this.charIndex.get(char)!.push(strId);

    const numId = Number(strId);
    if (!Number.isNaN(numId) && numId >= this.nextId) {
      this.nextId = numId + 1;
    }

    return true;
  }

  selectItems(ids: ItemId[]): void {
    for (const id of ids) {
      if (this.allItems.has(id) && !this.selectedSet.has(id)) {
        this.selectedSet.add(id);
        this.selectedItems.set(id, this.allItems.get(id)!);
        this.selectedOrder.push(id);
      }
    }
  }

  deselectItems(ids: ItemId[]): void {
    for (const id of ids) {
      this.selectedSet.delete(id);
      this.selectedItems.delete(id);
      this.selectedOrder = this.selectedOrder.filter((id) =>
        this.selectedSet.has(id),
      );
    }
  }

  private compactSelectedOrder(): void {
    this.selectedOrder = this.selectedOrder.filter((id) =>
      this.selectedSet.has(id),
    );
  }

  reorderSelected(fromIndex: number, toIndex: number, filter?: string): void {
    if (filter) {
      const filteredIndexes: number[] = [];

      for (let i = 0; i < this.selectedOrder.length; i++) {
        const id = this.selectedOrder[i];
        if (this.selectedSet.has(id) && id.includes(filter)) {
          filteredIndexes.push(i);
        }
      }

      const realFrom = filteredIndexes[fromIndex];
      const realTo = filteredIndexes[toIndex];

      if (realFrom === undefined || realTo === undefined) return;

      const [item] = this.selectedOrder.splice(realFrom, 1);
      this.selectedOrder.splice(realTo, 0, item);
    } else {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= this.selectedOrder.length ||
        toIndex >= this.selectedOrder.length
      ) {
        return;
      }

      const [item] = this.selectedOrder.splice(fromIndex, 1);
      this.selectedOrder.splice(toIndex, 0, item);
    }
  }

  private getCandidateIds(filter: string): ItemId[] {
    if (!filter) return this.allIds;

    if (filter.length === 1) {
      return this.charIndex.get(filter[0]) ?? [];
    }

    const key = filter.slice(0, 2);
    return this.prefixIndex.get(key) ?? [];
  }

  getAvailableItems(
    filter: string = "",
    startIndex: number = 0,
    count: number = 20,
  ): PagedResult<Item> {
    const result: Item[] = [];
    const candidates = this.getCandidateIds(filter);

    let total = 0;

    for (let i = 0; i < candidates.length; i++) {
      const id = candidates[i];

      if (this.selectedSet.has(id)) continue;
      if (filter && !id.includes(filter)) continue;

      if (total >= startIndex && result.length < count) {
        result.push(this.allItems.get(id)!);
      }

      total++;

      if (result.length === count && total > startIndex + count) {
        break;
      }
    }

    return { items: result, total };
  }

  getSelectedItems(
    filter: string = "",
    startIndex: number = 0,
    count: number = 20,
  ): PagedResult<Item> {
    this.compactSelectedOrder();

    const result: Item[] = [];
    let total = 0;

    for (let i = 0; i < this.selectedOrder.length; i++) {
      const id = this.selectedOrder[i];

      if (!this.selectedSet.has(id)) continue;

      const item = this.selectedItems.get(id)!;

      if (filter && !item.id.includes(filter)) continue;

      if (total >= startIndex && result.length < count) {
        result.push(item);
      }

      total++;

      if (result.length === count && total > startIndex + count) {
        break;
      }
    }

    return { items: result, total };
  }
}

export default new Store();
