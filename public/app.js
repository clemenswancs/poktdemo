const connectWalletBtn = document.getElementById('connectWallet');
const walletAddressEl = document.getElementById('walletAddress');
const walletBalanceEl = document.getElementById('walletBalance');
const networkSelect = document.getElementById('networkSelect');
const addressInput = document.getElementById('addressInput');
const getBalanceBtn = document.getElementById('getBalance');
const checkedBalanceEl = document.getElementById('checkedBalance');

let provider;
let signer;
let selectedAccount;

async function connectWallet() {
    try {
        const detectedProvider = await detectEthereumProvider();
        
        if (detectedProvider) {
            provider = new ethers.providers.Web3Provider(detectedProvider);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            selectedAccount = await signer.getAddress();
            walletAddressEl.textContent = `Connected: ${selectedAccount}`;
            await updateWalletBalance();
        } else {
            throw new Error("Please install MetaMask!");
        }
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        walletAddressEl.textContent = 'Failed to connect wallet';
    }
}

async function updateWalletBalance() {
    if (selectedAccount && provider) {
        try {
            const balance = await provider.getBalance(selectedAccount);
            const ethBalance = ethers.utils.formatEther(balance);
            walletBalanceEl.textContent = `Balance: ${ethBalance} ETH`;
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            walletBalanceEl.textContent = 'Error fetching balance';
        }
    }
}

async function getBalance() {
    const address = addressInput.value;
    const network = networkSelect.value;

    if (!address) {
        alert('Please enter an Ethereum address');
        return;
    }

    try {
        const response = await fetch('/get-balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address, network }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            checkedBalanceEl.textContent = `Error: ${data.error}`;
        } else {
            checkedBalanceEl.textContent = `Balance: ${data.balance} ETH`;
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        checkedBalanceEl.textContent = 'Error fetching balance';
    }
}

// Add event listeners
connectWalletBtn.addEventListener('click', connectWallet);
getBalanceBtn.addEventListener('click', getBalance);