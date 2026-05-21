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
    const source = openQueueEventSource((snapshot) => {
      if (!closed) {
        get().setSnapshot(snapshot);
        set({ connected: true });
      }
    });

    source.onerror = () => set({ connected: false });

    return () => {
      closed = true;
      source.close();
      set({ connected: false });
    };
  },
}));
