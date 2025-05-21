<template>
  <div id="app">
    <div class="dashboard">
      <h1>Weather & News Dashboard</h1>
      
      <!-- Cache status indicator -->
      <div v-if="usingCachedData" class="cache-indicator">
        Showing cached data from {{ formatDate(cacheTimestamp) }}
      </div>
      
      <!-- Rate limit warning -->
      <div v-if="rateLimitError" class="warning">
        {{ rateLimitError }}
      </div>
      
      <!-- Loading indicator -->
      <div v-if="loading && weatherData.length === 0 && newsData.length === 0" class="loading">Loading data...</div>
      
      <!-- Error message (only for non-rate-limit errors) -->
      <div v-if="error && !rateLimitError" class="error">{{ error }}</div>
      
      <!-- Always show dashboard if data exists -->
      <div v-if="weatherData.length > 0 || newsData.length > 0" class="dashboard-grid">
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
      rateLimitError: null,
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
      refreshInterval: null,
      usingCachedData: false,
      cacheTimestamp: null,
      // Cache expiration time (in minutes)
      cacheExpiryTime: 30
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
    // Cache management methods
    saveToCache(key, data) {
      try {
        const cacheItem = {
          data: data,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
        console.log(`Data saved to cache: ${key}`);
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    },
    
    loadFromCache(key) {
      try {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) return null;
        
        const { data, timestamp } = JSON.parse(cachedItem);
        
        // Check if cache is expired
        const cacheDate = new Date(timestamp);
        const now = new Date();
        const diffMinutes = (now - cacheDate) / (1000 * 60);
        
        if (diffMinutes > this.cacheExpiryTime) {
          console.log(`Cache expired for ${key} (${diffMinutes.toFixed(1)} minutes old)`);
          return null;
        }
        
        console.log(`Loaded from cache: ${key} (${diffMinutes.toFixed(1)} minutes old)`);
        return { data, timestamp };
      } catch (error) {
        console.error('Error loading from cache:', error);
        return null;
      }
    },
    
    async fetchData() {
      this.loading = true;
      this.error = null;
      this.rateLimitError = null;
      this.usingCachedData = false;
      
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
          
          // Save to cache
          this.saveToCache('weather-data', {
            items: this.weatherData,
            pagination: this.weatherPagination
          });
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
          
          // Save to cache
          this.saveToCache('news-data', {
            items: this.newsData,
            pagination: this.newsPagination
          });
        }
        
        // Save last successful fetch timestamp
        this.saveToCache('last-fetch', new Date().toISOString());
        
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // Check if this is a rate limit error (429)
        if (err.response && err.response.status === 429) {
          // Set the rate limit error message
          this.rateLimitError = 'Rate limit exceeded. Using cached data. Please try again later.';
          
          // Try to load from cache
          const weatherCache = this.loadFromCache('weather-data');
          const newsCache = this.loadFromCache('news-data');
          
          let cacheLoaded = false;
          
          if (weatherCache) {
            this.weatherData = weatherCache.data.items;
            this.weatherPagination = weatherCache.data.pagination;
            this.cacheTimestamp = weatherCache.timestamp;
            cacheLoaded = true;
          }
          
          if (newsCache) {
            this.newsData = newsCache.data.items;
            this.newsPagination = newsCache.data.pagination;
            if (!this.cacheTimestamp) this.cacheTimestamp = newsCache.timestamp;
            cacheLoaded = true;
          }
          
          if (cacheLoaded) {
            this.usingCachedData = true;
          }
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            this.rateLimitError = null;
          }, 5000);
        } else {
          // For other errors, set the regular error property
          this.error = 'Failed to load data. Please try again later.';
          
          // Try to load from cache as a fallback
          const weatherCache = this.loadFromCache('weather-data');
          const newsCache = this.loadFromCache('news-data');
          
          let cacheLoaded = false;
          
          if (weatherCache) {
            this.weatherData = weatherCache.data.items;
            this.weatherPagination = weatherCache.data.pagination;
            this.cacheTimestamp = weatherCache.timestamp;
            cacheLoaded = true;
          }
          
          if (newsCache) {
            this.newsData = newsCache.data.items;
            this.newsPagination = newsCache.data.pagination;
            if (!this.cacheTimestamp) this.cacheTimestamp = newsCache.timestamp;
            cacheLoaded = true;
          }
          
          if (cacheLoaded) {
            this.usingCachedData = true;
            this.error = 'Failed to refresh data. Showing cached data instead.';
          }
        }
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
          
          // Save to cache
          this.saveToCache('weather-data', {
            items: this.weatherData,
            pagination: this.weatherPagination
          });
          
          this.usingCachedData = false;
          
          const weatherPanel = document.querySelector('.weather-panel');
          if (weatherPanel) {
            weatherPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error loading weather page:', err);
        
        // Check if this is a rate limit error (429)
        if (err.response && err.response.status === 429) {
          this.rateLimitError = 'Rate limit exceeded. Using cached data. Please try again later.';
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            this.rateLimitError = null;
          }, 5000);
        } else {
          this.error = `Failed to load weather data: ${err.message}`;
          setTimeout(() => {
            if (this.error === err.message) {
              this.error = null;
            }
          }, 5000);
        }
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
          
          // Save to cache
          this.saveToCache('news-data', {
            items: this.newsData,
            pagination: this.newsPagination
          });
          
          this.usingCachedData = false;
          
          const newsPanel = document.querySelector('.news-panel');
          if (newsPanel) {
            newsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error loading news page:', err);
        
        // Check if this is a rate limit error (429)
        if (err.response && err.response.status === 429) {
          this.rateLimitError = 'Rate limit exceeded. Using cached data. Please try again later.';
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            this.rateLimitError = null;
          }, 5000);
        } else {
          this.error = `Failed to load news: ${err.message}`;
          
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            if (this.error === err.message) {
              this.error = null;
            }
          }, 5000);
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
