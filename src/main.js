import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

const app = createApp(App);

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.response && event.reason.response.status === 429) {
    const notifier = document.querySelector('rate-limit-notifier');
    if (notifier && notifier.__vue_app__) {
      notifier.__vue_app__.appContext.components.RateLimitNotifier.methods.showNotification();
    }
  }
});

app.mount('#app');
