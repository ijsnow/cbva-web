// import { test as setup } from '@playwright/test';
import { getMockDb } from '@/tests/db';
import { startApp } from '@/tests/server';

// setup('starting services', async () => {
//   console.log('initializing database...');

//   const { url } = await getMockDb()
// });

export default async function setup() {
  console.log('initializing database...');

  const { url } = await getMockDb()

  await startApp(url)
}
