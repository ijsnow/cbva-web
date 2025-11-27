import { deleteMockDb } from '@/tests/db';
import {  stopApp } from '@/tests/server';

// setup('starting services', async () => {
//   console.log('initializing database...');

//   const { url } = await getMockDb()
// });

export default async function setup() {
  await stopApp()
  await deleteMockDb()
}
