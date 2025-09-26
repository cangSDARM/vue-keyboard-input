import { createApp } from 'vue'
import './style.css'
// @ts-ignore
import vuetify from './vuetify';
// @ts-ignore
import App from './App.vue'
import { createI18n } from 'vue-i18n';

createApp(App).use(vuetify).use(createI18n({})).mount('#app')
