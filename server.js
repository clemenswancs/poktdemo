require('dotenv').config();
const express = require('express');
const path = require('path');
const { ethers } = require('ethers');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Infura and POKT endpoints from .env file
const infuraEndpoint = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;
const poktEndpoint = process.env.POKT_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/get-balance', async (req, res) => {
  const { address, network } = req.body;
  let provider;

  if (network === 'infura') {
    provider = new ethers.JsonRpcProvider(infuraEndpoint);
  } else if (network === 'pokt') {
    provider = new ethers.JsonRpcProvider(poktEndpoint);
  } else {
    return res.status(400).json({ error: 'Invalid network selection' });
  }

  try {
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.formatEther(balance);
    res.json({ balance: ethBalance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(400).json({ error: 'Error fetching balance' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});