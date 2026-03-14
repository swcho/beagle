import './assets/main.css'

import { ConfigProvider, theme } from 'antd'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgBase: '#18181b',
          colorPrimary: '#6366f1',
          borderRadius: 6
        }
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
)
