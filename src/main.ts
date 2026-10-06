// Fonts are self-hosted: no third-party requests, nothing for the CSP to allow-list.
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import '@fontsource-variable/inter/wght.css'
import './styles/base.css'

import { createApp } from 'vue'
import App from './App.vue'
import { vReveal } from './lib/reveal'

createApp(App).directive('reveal', vReveal).mount('#app')
