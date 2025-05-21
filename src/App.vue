<template>
  <div id="app">
    <div class="dashboard">
      <h1>Weather & News Dashboard</h1>
      
      <!-- Loading indicator -->
      <div v-if="loading" class="loading">Loading data...</div>
      
      <!-- Error message -->
      <div v-if="error" class="error">{{ error }}</div>
      
      <div v-if="!loading && !error" class="dashboard-grid">
        <!-- Weather Panel -->
        <div class="panel weather-panel">
          <h2>Weather Information</h2>
          <div v-if="weatherData.length > 0">
            <div v-for="(item, index) in weatherData" :key="index" class="weather-item">
              <h3>{{ item.city }}</h3>
              <p>Temperature: {{ item.temperature }}°C</p>
              <p>Humidity: {{ item.humidity }}%</p>
              <p>Updated: {{ formatDate(item.timestamp) }}</p>
            </div>
          </div>
          <div v-else>No weather data available</div>
        </div>
        
        <!-- News Panel -->
        <div class="panel news-panel">
          <h2>Latest News</h2>
          <div v-if="newsData.length > 0">
            <div v-for="(article, index) in newsData" :key="index" class="news-item">
              <h3>{{ article.title }}</h3>
              <p>{{ article.description }}</p>
              <p class="news-source">Source: {{ article.sourceName || 'Unknown' }}</p>
              <p class="news-date">Published: {{ formatDate(article.publishedAt) }}</p>
            </div>
          </div>
          <div v-else>No news articles available</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      loading: false,
      error: null,
      weatherData: [],
      newsData: []
    };
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      this.error = null;
      
      try {
        // You can add your API calls here
        // Example:
        // const weatherResponse = await axios.get('/api/weather');
        // this.weatherData = weatherResponse.data;
        // 
        // const newsResponse = await axios.get('/api/news');
        // this.newsData = newsResponse.data;
        
        // For now, using mock data
        this.weatherData = [
          { city: 'New York', temperature: 22, humidity: 65, timestamp: new Date() }
        ];
        
        this.newsData = [
          { 
            title: 'Sample News Article', 
            description: 'This is a sample news article description.',
            sourceName: 'Sample News',
            publishedAt: new Date()
          }
        ];
      } catch (err) {
        console.error('Error fetching data:', err);
        this.error = 'Failed to load data. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString();
    }
  }
};
</script>
