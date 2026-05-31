import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBxxx",
  authDomain: "fairgame-65fdd.firebaseapp.com",
  databaseURL: "https://fairgame-65fdd-default-rtdb.firebaseio.com",
  projectId: "fairgame-65fdd",
  storageBucket: "fairgame-65fdd.firebasestorage.app",
  messagingSenderId: "12828670518",
  appId: "1:12828670518:web:3bc3c50ab21991f845f697",
  measurementId: "G-NQ8YJC9DDT"
}

let app = null
let db = null

export function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig)
  }
  return app
}

export function getFirebaseDB() {
  if (!db) {
    const a = getFirebaseApp()
    db = getDatabase(a)
  }
  return db
}
