export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startActressRefreshScheduler } =
      await import('./server/jav-crawler/scheduler');
    startActressRefreshScheduler();
  }
}
