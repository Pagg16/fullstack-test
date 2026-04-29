import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ChangeEvent,
} from "react";
import { Virtuoso } from "react-virtuoso";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api, type ItemId } from "../api/api";
import { Loader } from "../Loader/Loader";

interface Item {
  id: ItemId;
  name: string;
}

interface SortableItemData extends Item {
  sortableId: string;
}

interface Props {
  isRefresh: boolean;
  onSelectionChange: () => void;
}

function SortableItem({
  id,
  item,
  onSelect,
  isChecked,
}: {
  id: string;
  item: SortableItemData;
  onSelect?: (id: string) => void;
  isChecked: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="item sortable-item">
      <div className="drag-handle" {...attributes} {...listeners}>
        ⠿
      </div>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => onSelect?.(id)}
      />
      <span>ID: {item.id}</span>
      <span>{item.name}</span>
    </div>
  );
}

function RightPanel({ isRefresh, onSelectionChange }: Props) {
  const [items, setItems] = useState<SortableItemData[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<ItemId[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    const requestId = ++requestIdRef.current;

    try {
      const result = await api.getSelectedItems(filter, offsetRef.current, 20);

      if (!result || !Array.isArray(result.items)) return;

      if (requestId !== requestIdRef.current) return;

      const mapped = result.items.map((i) => ({
        ...i,
        sortableId: `item-${i.id}`,
      }));

      setItems((prev) => [...prev, ...mapped]);

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

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFilter(e.target.value);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.sortableId === active.id);
    const newIndex = items.findIndex((i) => i.sortableId === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    api.reorderItems(oldIndex, newIndex, filter);
  };

  const moveToLeft = async () => {
    if (selectedIds.length === 0) return;

    await api.deselectItems(selectedIds);
    setSelectedIds([]);
    onSelectionChange();
  };

  const handleSelect = useCallback(
    (sortableId: string) => {
      const realId = items.find((i) => i.sortableId === sortableId)?.id;
      if (!realId) return;

      setSelectedIds((prev) => {
        if (prev.includes(realId)) {
          return prev.filter((id) => id !== realId);
        } else {
          return [...prev, realId];
        }
      });
    },
    [items],
  );

  return (
    <div className="panel right-panel">
      <h2>Selected Items</h2>

      <div className="controls">
        <input value={filter} onChange={handleFilterChange} />

        <button onClick={moveToLeft} disabled={selectedIds.length === 0}>
          Move Selected ({selectedIds.length})
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.sortableId)}
          strategy={verticalListSortingStrategy}
        >
          <Virtuoso
            key={filter + "_" + isRefresh}
            data={items}
            itemContent={(_, item) => (
              <SortableItem
                id={item.sortableId}
                item={item}
                onSelect={handleSelect}
                isChecked={selectedIds.includes(item.id)}
              />
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
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default RightPanel;
