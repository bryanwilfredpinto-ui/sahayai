import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#151b23',
            color: '#e6edf3',
            border: '1px solid #273142',
            borderRadius: '14px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0b0f14' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0b0f14' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
