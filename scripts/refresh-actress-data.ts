import { refreshActressData } from '../src/server/jav-crawler/crawler';

const success = await refreshActressData(true);
if (!success) process.exitCode = 1;
