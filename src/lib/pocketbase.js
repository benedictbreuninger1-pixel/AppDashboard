import PocketBase from 'pocketbase';

// Deine echte Backend-URL
export const POCKETBASE_URL = 'https://pb.kingbreuninger.de'; 

export const pb = new PocketBase(POCKETBASE_URL);

// Request-Abbruch in React StrictMode verhindern
pb.autoCancellation(false);