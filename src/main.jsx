import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FeedbackProvider } from './components/feedback'

const tree = (
  <StrictMode>
    <FeedbackProvider>
      <App />
    </FeedbackProvider>
  </StrictMode>
)
const rootEl = document.getElementById('root')
// Public pages are prerendered at build time (scripts/prerender.mjs) → hydrate them; private routes and unknown URLs get the empty shell → render.
if (rootEl.hasChildNodes()) hydrateRoot(rootEl, tree)
else createRoot(rootEl).render(tree)
