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
      newsData: [],
      refreshInterval: null
    };
  },
  async mounted() {
    console.log('App mounted, fetching data...');
    this.fetchData();
    
    // Set up auto-refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      console.log('Auto-refreshing data...');
      this.fetchData();
    }, 5 * 60 * 1000);
  },
  beforeUnmount() {
    // Clear the interval when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async fetchData() {
      this.loading = true;
      this.error = null;
      
      try {
        console.log('Starting API request to http://localhost:3000/api/aggregated-data');
        
        // Fetch aggregated data from the API
        const response = await axios.get('http://localhost:3000/api/aggregated-data', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        console.log('API Response Status:', response.status);
        console.log('API Response Data:', response.data);
        
        if (!response.data) {
          throw new Error('No data received from the API');
        }
        
        // Process the data from the API response
        const data = response.data.data;
        
        // Process weather data
        if (data && Array.isArray(data.weather)) {
          // Group by city and get the latest entry for each city
          const weatherByCity = {};
          data.weather.forEach(item => {
            if (item && item.city) {
              const cityName = item.city.trim();
              if (!weatherByCity[cityName] || new Date(item.timestamp) > new Date(weatherByCity[cityName].timestamp)) {
                weatherByCity[cityName] = item;
              }
            }
          });
          
          // Convert to array and format the data
          this.weatherData = Object.values(weatherByCity).map(item => ({
            city: item.city.trim(),
            temperature: item.temperature,
            humidity: item.humidity,
            timestamp: item.timestamp
          }));
          
          console.log('Processed weather data:', this.weatherData);
        } else {
          console.warn('No weather data found in response:', data);
        }
        
        // Process news data
        if (data && Array.isArray(data.news)) {
          this.newsData = data.news
            .filter(article => article && article.title) // Filter out invalid entries
            .map(article => ({
              title: article.title.trim(),
              description: article.description || 'No description available',
              sourceName: article.source || 'Unknown',
              publishedAt: article.publishedAt || new Date().toISOString()
            }));
          
          console.log('Processed news data:', this.newsData);
        } else {
          console.warn('No news data found in response:', data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        this.error = 'Failed to load data. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      if (!date) return 'N/A';
      try {
        // Handle both ISO string and timestamp formats
        const dateObj = new Date(date);
        return dateObj.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        console.error('Error formatting date:', e);
        return 'N/A';
      }
    }
  }
};
</script>
