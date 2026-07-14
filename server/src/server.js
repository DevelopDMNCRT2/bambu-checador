require('dotenv').config();
const app = require('./app');
const { startAutoCutScheduler } = require('./utils/scheduler');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAutoCutScheduler();
});

// Force restart to load env

