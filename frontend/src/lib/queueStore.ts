import { create } from 'zustand';
import { emptyQueueSnapshot, fetchQueueState, openQueueEventSource, type QueueSnapshot } from './queue';

type QueueStore = {
  snapshot: QueueSnapshot;
  connected: boolean;
  lastCalledTicket: string | null;
  setSnapshot: (snapshot: QueueSnapshot) => void;
  refresh: () => Promise<void>;
  connect: () => () => void;
};

export const useQueueStore = create<QueueStore>((set, get) => ({
  snapshot: emptyQueueSnapshot,
  connected: false,
  lastCalledTicket: null,
  setSnapshot: (snapshot) => {
    const previousActive = get().snapshot.containers
      .map((container) => container.activeTicket?.id)
      .filter(Boolean)
      .join('|');
    const nextActive = snapshot.containers
      .map((container) => container.activeTicket?.id)
      .filter(Boolean)
      .join('|');

    set({
      snapshot,
      lastCalledTicket: previousActive !== nextActive
        ? snapshot.containers.find((container) => container.activeTicket)?.activeTicket?.id ?? null
        : get().lastCalledTicket,
    });
  },
  refresh: async () => {
    const snapshot = await fetchQueueState();
    get().setSnapshot(snapshot);
  },
  connect: () => {
    let closed = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const startStream = () => {
      if (closed) return;

      source?.close();
      source = openQueueEventSource((snapshot) => {
        if (!closed) {
          get().setSnapshot(snapshot);
          set({ connected: true });
        }
      });

      source.onopen = () => {
        if (!closed) set({ connected: true });
      };

      source.onerror = () => {
        if (closed) return;

        set({ connected: false });
        source?.close();
        reconnectTimer = setTimeout(startStream, 2000);
      };
    };

    startStream();

    const pollTimer = setInterval(() => {
      get().refresh().catch(() => {
        if (!closed) set({ connected: false });
      });
    }, 3000);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(pollTimer);
      source?.close();
      set({ connected: false });
    };
  },
}));
