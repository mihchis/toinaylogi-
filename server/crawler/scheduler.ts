import { refreshActressData } from './crawler';
import { isDue } from './store';

const WEEK = 7 * 24 * 60 * 60 * 1000;
const RETRY = 15 * 60 * 1000;
let started = false;
let timer: NodeJS.Timeout | undefined;

async function schedule() {
  const due = await isDue();
  if (due) {
    const success = await refreshActressData();
    timer = setTimeout(() => void schedule(), success ? WEEK : RETRY);
  } else {
    timer = setTimeout(() => void schedule(), 60 * 60 * 1000);
  }
  timer.unref();
}

export function startActressRefreshScheduler() {
  if (started) return;
  started = true;
  void schedule();
}
