import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ChangeEvent,
} from "react";
import { Virtuoso } from "react-virtuoso";
import { api, type ItemId } from "../api/api";
import { Loader } from "../Loader/Loader";

interface Item {
  id: ItemId;
  name: string;
}

interface Props {
  isRefresh: boolean;
  onSelectionChange: () => void;
}

function LeftPanel({ isRefresh, onSelectionChange }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<ItemId[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    const requestId = ++requestIdRef.current;

    try {
      const result = await api.getAvailableItems(filter, offsetRef.current, 20);

      if (!result || !Array.isArray(result.items)) return;

      if (requestId !== requestIdRef.current) return;

      setItems((prev) => [...prev, ...result.items]);

      offsetRef.current += result.items.length;

      if (offsetRef.current >= result.total) {
        hasMoreRef.current = false;
      }
    } catch (e) {
      console.error("LOAD ERROR", e);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    requestIdRef.current++;

    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems([]);
    loadMore();
  }, [filter, isRefresh]);

  const handleFilterChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  const handleCheckboxChange = useCallback((id: ItemId) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const moveToRight = useCallback(async () => {
    if (selectedIds.length === 0) return;

    await api.selectItems([...selectedIds]);
    setSelectedIds([]);
    onSelectionChange();
  }, [selectedIds, onSelectionChange]);

  return (
    <div className="panel left-panel">
      <h2>Available Items</h2>
      <div className="controls">
        <input type="text" value={filter} onChange={handleFilterChange} />

        <button onClick={moveToRight} disabled={selectedIds.length === 0}>
          Move Selected ({selectedIds.length})
        </button>
      </div>

      <Virtuoso
        key={filter + "_" + isRefresh}
        data={items}
        itemContent={(_, item) => (
          <div onClick={() => handleCheckboxChange(item.id)} className="item">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => {}}
            />
            <span>{item.id}</span>
            <span>{item.name}</span>
          </div>
        )}
        endReached={() => {
          if (!loadingRef.current && hasMoreRef.current) {
            loadMore();
          }
        }}
        components={{
          Footer: () => (isLoading ? <Loader /> : null),
        }}
      />
    </div>
  );
}

export default LeftPanel;
