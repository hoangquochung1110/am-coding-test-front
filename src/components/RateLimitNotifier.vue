<template>
  <div v-if="show" class="rate-limit-notification">
    <div class="notification-content">
      <span>⚠️ {{ message }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RateLimitNotifier',
  data() {
    return {
      show: false,
      message: 'Too many requests, please wait before retrying.',
      timeout: null
    }
  },
  methods: {
    showNotification() {
      this.show = true;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.show = false;
      }, 5000);
    }
  }
}
</script>

<style scoped>
.rate-limit-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background-color: #ffebee;
  color: #c62828;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
