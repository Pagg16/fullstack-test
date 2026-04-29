import express, { Request, Response } from "express";
import cors from "cors";
import store from "./store";
import queue, { QueueEntry } from "./queue";

type RequestType = "get" | "modify" | "add";

interface GetRequestData {
  action: "available" | "selected" | "state";
  filter?: string;
  startIndex?: number;
  count?: number;
}

interface ModifyRequestData {
  action: "select" | "deselect" | "reorder";
  ids?: string[];
  fromIndex?: number;
  toIndex?: number;
  filter?: string;
}

interface AddRequestData {
  id: string;
}

type QueueData = GetRequestData | ModifyRequestData | AddRequestData;

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

store.initialize();

setInterval(() => {
  const getBatch: QueueEntry<GetRequestData>[] = queue.dequeue("get");

  getBatch.forEach(({ data, resolvers }) => {
    const result = handleGetRequest(data);
    resolvers.forEach((resolve) => resolve(result));
  });

  const modifyBatch: QueueEntry<ModifyRequestData>[] = queue.dequeue("modify");

  modifyBatch.forEach(({ data, resolvers }) => {
    const result = handleModifyRequest(data);
    resolvers.forEach((resolve) => resolve(result));
  });
}, 1000);

setInterval(() => {
  const addBatch: QueueEntry<AddRequestData>[] = queue.dequeue("add");

  addBatch.forEach(({ data, resolvers }) => {
    const result = store.addItem(data.id);
    resolvers.forEach((resolve) => resolve({ success: result }));
  });
}, 10000);

function handleGetRequest(data: GetRequestData): any {
  const { action, filter = "", startIndex = 0, count = 20 } = data;

  switch (action) {
    case "available":
      return store.getAvailableItems(filter, startIndex, count);

    case "selected":
      return store.getSelectedItems(filter, startIndex, count);

    default:
      return {};
  }
}

function handleModifyRequest(data: ModifyRequestData): { success: boolean } {
  const { action, ids = [], fromIndex = 0, toIndex = 0 } = data;

  switch (action) {
    case "select":
      store.selectItems(ids);
      break;

    case "deselect":
      store.deselectItems(ids);
      break;

    case "reorder":
      store.reorderSelected(fromIndex, toIndex, data.filter);
      break;
  }

  return { success: true };
}

app.post("/api/request", (req: Request, res: Response) => {
  try {
    console.log("REQUEST HIT");
    console.log("BODY:", req.body);

    const { type, data } = req.body as {
      type: RequestType;
      data: QueueData;
    };

    console.log("👉 BEFORE QUEUE");

    queue.enqueue(type, data, (result: any) => {
      try {
        console.log("👉 CALLBACK FIRED");
        console.log("RESULT:", result);
        console.log("STORE SIZE:", store.allItems.size);

        if (!result) {
          console.log("RESULT IS EMPTY");
        }

        res.json(result ?? { ok: true });
      } catch (err) {
        console.error("ERROR IN CALLBACK:", err);
        res.status(500).json({ error: "callback error" });
      }
    });

    console.log("AFTER QUEUE CALL");
  } catch (err) {
    console.error("REQUEST ERROR:", err);
    res.status(500).json({ error: "request fadiled" });
  }
});

const PORT: number = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
