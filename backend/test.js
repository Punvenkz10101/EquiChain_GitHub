// backend/test.js
const { sendMessageTransaction } = require('./web3-utils');

(async () => {
  try {
    console.log("Testing blockchain transaction...");
    
    // First check balance
    const balance = await web3.eth.getBalance(account.address);
    console.log('Current Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
    
    // Then send test transaction
    const result = await sendMessageTransaction('Hello Blockchain!');
    console.log('Transaction successful:', {
      txHash: result.transactionHash,
      blockNumber: result.blockNumber
    });
  } catch (error) {
    console.error('Transaction failed:', error);
  }
})();