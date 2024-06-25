import { ethers } from 'ethers';

// 1. Define an interface for providers
class Web3Provider {
  constructor(config) {
    this.config = config;
  }

  async getProvider() {
    throw new Error('Not implemented');
  }

  async isAvailable() {
    throw new Error('Not implemented');
  }
}

// 2. Implement each provider
class InfuraProvider extends Web3Provider {
  async getProvider() {
    return new ethers.providers.InfuraProvider('mainnet', this.config.projectId);
  }

  async isAvailable() {
    try {
      const provider = await this.getProvider();
      await provider.getNetwork();
      return true;
    } catch (error) {
      return false;
    }
  }
}

class AlchemyProvider extends Web3Provider {
  async getProvider() {
    return new ethers.providers.AlchemyProvider('mainnet', this.config.apiKey);
  }

  async isAvailable() {
    // Similar to InfuraProvider
  }
}

class MetaMaskProvider extends Web3Provider {
  async getProvider() {
    if (typeof window.ethereum !== 'undefined') {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    throw new Error('MetaMask not available');
  }

  async isAvailable() {
    return typeof window.ethereum !== 'undefined';
  }
}

// Implement other providers similarly...

// 3. Create a multiplexer class
class Web3Multiplexer {
  constructor(providers) {
    this.providers = providers;
    this.currentProviderIndex = 0;
  }

  async getProvider() {
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];
      
      if (await provider.isAvailable()) {
        this.currentProviderIndex = providerIndex;
        return provider.getProvider();
      }
    }
    throw new Error('No providers available');
  }

  async executeRequest(request) {
    for (let i = 0; i < this.providers.length; i++) {
      try {
        const provider = await this.getProvider();
        return await request(provider);
      } catch (error) {
        console.error(`Provider failed: ${error.message}`);
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
      }
    }
    throw new Error('All providers failed');
  }
}

// 4. Usage
const multiplexer = new Web3Multiplexer([
  new InfuraProvider({ projectId: 'YOUR_INFURA_PROJECT_ID' }),
  new AlchemyProvider({ apiKey: 'YOUR_ALCHEMY_API_KEY' }),
  new MetaMaskProvider(),
  // Add other providers...
]);

// Example usage
async function getLatestBlock() {
  return multiplexer.executeRequest(async (provider) => {
    return await provider.getBlockNumber();
  });
}


/* 
//exploring some expansions
// Implement more providers
// Add more sophisticated load balancing (e.g., weighted round-robin, least connections).
// Implement caching to reduce redundant calls across providers.
// Add retry logic with exponential backoff for temporary failures.
// Implement rate limiting to avoid exceeding API limits.
// Add monitoring and logging to track provider performance and availability.
// Implement automatic provider rotation based on performance metrics.

class Web3Multiplexer2 {
    constructor(providers) {
      this.providers = providers.map(p => ({
        provider: p,
        weight: p.config.weight || 1,
        failureCount: 0,
        lastUsed: 0
      }));
      this.cache = new Map();
    }
  
    async getProvider() {
      const now = Date.now();
      const availableProviders = this.providers.filter(p => 
        p.failureCount < 3 && now - p.lastUsed > 1000 / p.weight
      );
  
      if (availableProviders.length === 0) {
        throw new Error('No providers available');
      }
  
      const provider = availableProviders.reduce((a, b) => 
        a.lastUsed < b.lastUsed ? a : b
      );
  
      provider.lastUsed = now;
      return provider.provider.getProvider();
    }
  
    async executeRequest(request, cacheKey = null, cacheTTL = 0) {
      if (cacheKey && this.cache.has(cacheKey) && Date.now() < this.cache.get(cacheKey).expiry) {
        return this.cache.get(cacheKey).value;
      }
  
      for (let providerData of this.providers) {
        try {
          const provider = await providerData.provider.getProvider();
          const result = await request(provider);
          providerData.failureCount = 0;
  
          if (cacheKey) {
            this.cache.set(cacheKey, {
              value: result,
              expiry: Date.now() + cacheTTL
            });
          }
  
          return result;
        } catch (error) {
          console.error(`Provider failed: ${error.message}`);
          providerData.failureCount++;
        }
      }
      throw new Error('All providers failed');
    }
  }
  */