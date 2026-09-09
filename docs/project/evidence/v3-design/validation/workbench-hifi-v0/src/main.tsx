import { createRoot } from 'react-dom/client';
import App from './App';
import { preloadBowlArtwork } from './bowl-art';
import './styles.css';

// Decode once before either the live bowl or the archive reconstruction uses
// the shared artwork. The factory retains a procedural fallback on failure.
preloadBowlArtwork().then(()=>createRoot(document.getElementById('root')!).render(<App/>));
