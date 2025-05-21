const { createApp, ref, onMounted } = Vue;

const app = createApp({
  setup() {
    const loading = ref(true);
    const error = ref(null);
    const weatherData = ref([]);
    const newsData = ref([]);

    const fetchData = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        // Direct API call with detailed logging
        const apiUrl = 'http://localhost:3000/api/aggregated-data';
        console.log(`Fetching data from ${apiUrl}...`);
        
        const response = await axios({
          method: 'get',
          url: apiUrl,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // Important for CORS
          withCredentials: false
        });
        
        console.log('Response received:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data ? 'Data received' : 'No data received'
        });
        
        // Process the response data
        if (response.data) {
          // Handle both possible response formats
          const responseData = response.data.data || response.data;
          weatherData.value = responseData.weather || [];
          newsData.value = responseData.news || [];
          console.log(`Loaded ${weatherData.value.length} weather records and ${newsData.value.length} news items`);
        } else {
          throw new Error('Empty response received from server');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        error.value = 'Failed to load data. Please try again later.';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Fetch data when component is mounted
    onMounted(() => {
      fetchData();
      
      // Optional: Refresh data every 5 minutes
      // setInterval(fetchData, 5 * 60 * 1000);
    });

    return {
      loading,
      error,
      weatherData,
      newsData,
      formatDate
    };
  }
});

app.mount('#app');
