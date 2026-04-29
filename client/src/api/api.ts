const API_URL: string = import.meta.env.VITE_API_URL || "/api/request";

type RequestType = "get" | "modify" | "add";

export type ItemId = string;

interface Item {
  id: ItemId;
  name: string;
}

interface PagedResult<T> {
  items: T[];
  total: number;
}

interface GetAvailableRequest {
  action: "available";
  filter?: string;
  startIndex?: number;
  count?: number;
}

interface GetSelectedRequest {
  action: "selected";
  filter?: string;
  startIndex?: number;
  count?: number;
}


interface ModifySelectRequest {
  action: "select";
  ids: ItemId[];
}

interface ModifyDeselectRequest {
  action: "deselect";
  ids: ItemId[];
}

interface ModifyReorderRequest {
  action: "reorder";
  fromIndex: number;
  toIndex: number;
  filter?: string;
}

interface AddRequest {
  id: ItemId;
}

interface ModifyResponse {
  success: boolean;
}

interface AddResponse {
  success: boolean;
}

async function makeRequest<TResponse, TData>(
  type: RequestType,
  data: TData,
): Promise<TResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, data }),
  });

  return response.json() as Promise<TResponse>;
}

export const api = {
  getAvailableItems: (
    filter: string = "",
    startIndex: number = 0,
    count: number = 20,
  ) =>
    makeRequest<PagedResult<Item>, GetAvailableRequest>("get", {
      action: "available",
      filter,
      startIndex,
      count,
    }),

  getSelectedItems: (
    filter: string = "",
    startIndex: number = 0,
    count: number = 20,
  ) =>
    makeRequest<PagedResult<Item>, GetSelectedRequest>("get", {
      action: "selected",
      filter,
      startIndex,
      count,
    }),

  selectItems: (ids: ItemId[]) =>
    makeRequest<ModifyResponse, ModifySelectRequest>("modify", {
      action: "select",
      ids,
    }),

  deselectItems: (ids: ItemId[]) =>
    makeRequest<ModifyResponse, ModifyDeselectRequest>("modify", {
      action: "deselect",
      ids,
    }),

  reorderItems: (fromIndex: number, toIndex: number, filter?: string) =>
    makeRequest<ModifyResponse, ModifyReorderRequest>("modify", {
      action: "reorder",
      fromIndex,
      toIndex,
      filter,
    }),

  addItem: (id: ItemId) => makeRequest<AddResponse, AddRequest>("add", { id }),
};
