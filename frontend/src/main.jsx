import { StrictMode } from 'react' 
import { createRoot } from 'react-dom/client' 
import './index.css' 
import HomePage from './pages/HomePage.jsx'
import YourGoodDeed from './pages/YourGoodDeed.jsx'


createRoot(document.getElementById('root')).render (
   <StrictMode> 
    <YourGoodDeed /> 
    </StrictMode> 
  )