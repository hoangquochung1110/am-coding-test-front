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
          <div class="panel-header">
            <h2>Weather Information</h2>
            <div class="pagination-info" v-if="weatherData.length > 0">
              Page {{ weatherPagination.currentPage }} of {{ weatherPagination.totalPages }}
              ({{ weatherPagination.totalItems }} total records)
            </div>
          </div>
          <div v-if="weatherData.length > 0">
            <div v-for="(item, index) in weatherData" :key="index" class="weather-item">
              <h3>{{ item.city }}</h3>
              <p>Temperature: {{ item.temperature }}°C</p>
              <p>Humidity: {{ item.humidity }}%</p>
              <p>Updated: {{ formatDate(item.timestamp) }}</p>
            </div>
            <div class="pagination-controls" v-if="weatherPagination.totalPages > 1">
              <button 
                @click="loadWeatherPage(weatherPagination.currentPage - 1)" 
                :disabled="weatherPagination.currentPage <= 1"
              >
                Previous
              </button>
              <button 
                @click="loadWeatherPage(weatherPagination.currentPage + 1)" 
                :disabled="weatherPagination.currentPage >= weatherPagination.totalPages"
              >
                Next
              </button>
            </div>
          </div>
          <div v-else>No weather data available</div>
        </div>
        
        <!-- News Panel -->
        <div class="panel news-panel">
          <div class="panel-header">
            <h2>Latest News</h2>
            <div class="pagination-info" v-if="newsData.length > 0">
              Page {{ newsPagination.currentPage }} of {{ newsPagination.totalPages }}
              ({{ newsPagination.totalItems }} total articles)
            </div>
          </div>
          <div v-if="newsData.length > 0">
            <div v-for="(article, index) in newsData" :key="index" class="news-item">
              <h3>{{ article.title }}</h3>
              <p>{{ article.description }}</p>
              <div class="news-meta">
                <span class="news-source" v-if="article.author">By {{ article.author }}</span>
                <span class="news-source" v-if="article.sourceName">• {{ article.sourceName }}</span>
              </div>
              <p class="news-date">Published: {{ formatDate(article.publishedAt) }}</p>
              <a v-if="article.url" :href="article.url" target="_blank" class="read-more">Read more</a>
            </div>
            <div class="pagination-controls" v-if="newsPagination.totalPages > 1">
              <button 
                @click="loadNewsPage(newsPagination.currentPage - 1)" 
                :disabled="newsPagination.currentPage <= 1"
              >
                Previous
              </button>
              <button 
                @click="loadNewsPage(newsPagination.currentPage + 1)" 
                :disabled="newsPagination.currentPage >= newsPagination.totalPages"
              >
                Next
              </button>
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
      weatherPagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      },
      newsPagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      },
      refreshInterval: null
    };
  },
  mounted() {
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
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const apiUrl = `${apiBaseUrl}/api/aggregated-data`;
        
        console.log(`Starting API request to ${apiUrl}`);
        
        // Fetch aggregated data from the API
        const response = await axios.get(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        console.log('API Response Status:', response.status);
        console.log('Raw API Response:', JSON.stringify(response.data, null, 2));
        
        if (!response.data) {
          throw new Error('No data received from the API');
        }
        
        // Process the data from the API response
        const data = response.data?.data;
        
        if (!data) {
          throw new Error('Invalid response format: missing data property');
        }
        
        // Process weather data with pagination
        if (data.weather?.items && Array.isArray(data.weather.items)) {
          // Filter out any invalid weather items
          this.weatherData = data.weather.items.filter(item => 
            item.city && 
            typeof item.temperature === 'number' &&
            typeof item.humidity === 'number' &&
            item.timestamp
          );
          
          // Ensure pagination data is valid
          const weatherPagination = data.weather.pagination || {};
          this.weatherPagination = {
            currentPage: Math.max(1, parseInt(weatherPagination.currentPage) || 1),
            itemsPerPage: Math.max(1, parseInt(weatherPagination.itemsPerPage) || 10),
            totalItems: Math.max(0, parseInt(weatherPagination.totalItems) || 0),
            totalPages: Math.max(1, parseInt(weatherPagination.totalPages) || 1),
            hasNextPage: Boolean(weatherPagination.hasNextPage),
            hasPreviousPage: Boolean(weatherPagination.hasPreviousPage)
          };
          
          console.log('Processed weather data:', {
            items: this.weatherData,
            pagination: this.weatherPagination
          });
        } else {
          console.warn('No valid weather data found in response');
          this.weatherData = [];
          this.weatherPagination = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          };
        }
        
        // Process news data with pagination
        if (data.news?.items && Array.isArray(data.news.items)) {
          // Filter out any invalid news items
          this.newsData = data.news.items.filter(item => 
            item.title && 
            item.description && 
            item.url &&
            item.publishedAt
          );
          
          // Ensure pagination data is valid
          const newsPagination = data.news.pagination || {};
          this.newsPagination = {
            currentPage: Math.max(1, parseInt(newsPagination.currentPage) || 1),
            itemsPerPage: Math.max(1, parseInt(newsPagination.itemsPerPage) || 10),
            totalItems: Math.max(0, parseInt(newsPagination.totalItems) || 0),
            totalPages: Math.max(1, parseInt(newsPagination.totalPages) || 1),
            hasNextPage: Boolean(newsPagination.hasNextPage),
            hasPreviousPage: Boolean(newsPagination.hasPreviousPage)
          };
          
          console.log('Processed news data:', {
            items: this.newsData,
            pagination: this.newsPagination
          });
        } else {
          console.warn('No valid news data found in response');
          this.newsData = [];
          this.newsPagination = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          };
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
    },
    async loadWeatherPage(page) {
      if (page < 1 || page > this.weatherPagination.totalPages) return;
      
      this.loading = true;
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiBaseUrl}/api/weather?page=${page}&limit=${this.weatherPagination.itemsPerPage}`);
        const data = response.data?.data;
        
        if (data?.items) {
          this.weatherData = data.items.filter(item => item.city && typeof item.temperature === 'number');
          const pagination = data.pagination || {};
          this.weatherPagination = {
            currentPage: Math.max(1, parseInt(pagination.currentPage) || page),
            itemsPerPage: Math.max(1, parseInt(pagination.itemsPerPage) || this.weatherPagination.itemsPerPage),
            totalItems: Math.max(0, parseInt(pagination.totalItems) || this.weatherPagination.totalItems),
            totalPages: Math.max(1, parseInt(pagination.totalPages) || this.weatherPagination.totalPages),
            hasNextPage: Boolean(pagination.hasNextPage),
            hasPreviousPage: Boolean(pagination.hasPreviousPage)
          };
          const weatherPanel = document.querySelector('.weather-panel');
          if (weatherPanel) {
            weatherPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error loading weather page:', err);
        this.error = `Failed to load weather data: ${err.message}`;
        setTimeout(() => {
          if (this.error === err.message) {
            this.error = null;
          }
        }, 5000);
      } finally {
        this.loading = false;
      }
    },
    async loadNewsPage(page) {
      if (page < 1 || page > this.newsPagination.totalPages) return;
      
      this.loading = true;
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiBaseUrl}/api/news?page=${page}&limit=${this.newsPagination.itemsPerPage}`);
        const data = response.data?.data;
        
        if (data?.items) {
          this.newsData = data.items.filter(item => item.title && item.url && item.publishedAt);
          const pagination = data.pagination || {};
          this.newsPagination = {
            currentPage: Math.max(1, parseInt(pagination.currentPage) || page),
            itemsPerPage: Math.max(1, parseInt(pagination.itemsPerPage) || this.newsPagination.itemsPerPage),
            totalItems: Math.max(0, parseInt(pagination.totalItems) || this.newsPagination.totalItems),
            totalPages: Math.max(1, parseInt(pagination.totalPages) || this.newsPagination.totalPages),
            hasNextPage: Boolean(pagination.hasNextPage),
            hasPreviousPage: Boolean(pagination.hasPreviousPage)
          };
          
          const newsPanel = document.querySelector('.news-panel');
          if (newsPanel) {
            newsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error loading news page:', err);
        this.error = `Failed to load news: ${err.message}`;
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          if (this.error === err.message) {
            this.error = null;
          }
        }, 5000);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
