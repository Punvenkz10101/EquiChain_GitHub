const { Web3 } = require('web3');
require('dotenv').config();

// Initialize Web3 with Sepolia testnet via Alchemy
const web3 = new Web3(process.env.ALCHEMY_URL);

// Validate and format private key (add '0x' if missing)
const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY 
    : '0x' + process.env.PRIVATE_KEY;

// Initialize account
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

/**
 * Encodes a UTF-8 string into a hex string (reversible)
 */
function encodeMessage(message) {
    return '0x' + Buffer.from(message, 'utf8').toString('hex');
}

/**
 * Decodes a hex string back to UTF-8 (if encoded with `encodeMessage`)
 */
function decodeMessage(hexString) {
    return Buffer.from(hexString.replace('0x', ''), 'hex').toString('utf8');
}

/**
 * Checks the ETH balance of the account
 */
async function checkBalance() {
    const balance = await web3.eth.getBalance(account.address);
    return {
        wei: balance.toString(), // Return as string to avoid BigInt issues
        eth: web3.utils.fromWei(balance, 'ether')
    };
}

/**
 * Estimates transaction cost in ETH
 */
async function estimateTxCost(gasEstimate, gasPrice) {
    const costWei = gasEstimate * gasPrice;
    return {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        costEth: web3.utils.fromWei(costWei.toString(), 'ether')
    };
}

/**
 * Sends a message transaction to Sepolia (with reversible encoding)
 */
async function sendMessageTransaction(message) {
    try {
        console.log("[1/5] Checking account balance...");
        const { eth: balanceEth } = await checkBalance();
        if (Number(balanceEth) < 0.01) throw new Error("Insufficient ETH (< 0.01)");

        console.log("[2/5] Encoding message...");
        const encodedMessage = encodeMessage(message);

        console.log("[3/5] Building transaction...");
        const txObject = {
            from: account.address,
            to: account.address, // Sending to self
            value: '0',
            data: encodedMessage, // Store encoded message (reversible)
            gas: '100000' // Initial safe estimate
        };

        console.log("[4/5] Estimating gas...");
        const gasEstimate = await web3.eth.estimateGas(txObject);
        const gasPrice = await web3.eth.getGasPrice();
        const { costEth } = await estimateTxCost(gasEstimate, gasPrice);

        // Add 25% buffer to gas (using BigInt math)
        const gasWithBuffer = (gasEstimate * 5n) / 4n;
        txObject.gas = gasWithBuffer.toString();
        txObject.gasPrice = gasPrice.toString();

        console.log(`[5/5] Sending tx (Cost: ~${costEth} ETH)...`);
        const signedTx = await account.signTransaction(txObject);
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log("[6/6] Transaction mined!");
        return {
            txHash: txReceipt.transactionHash,
            blockNumber: Number(txReceipt.blockNumber),
            gasUsed: txReceipt.gasUsed.toString(),
            costEth: web3.utils.fromWei(
                (BigInt(txReceipt.gasUsed) * gasPrice).toString(),
                'ether'
            ),
            originalMessage: message, // Return original message for verification
            encodedMessage: encodedMessage // Return encoded version
        };
    } catch (error) {
        console.error("Transaction failed:", error.message);
        throw error;
    }
}

/**
 * Retrieves and decodes a message from a transaction
 */
async function getMessageFromTx(txHash) {
    const tx = await web3.eth.getTransaction(txHash);
    return decodeMessage(tx.input); // Decodes back to original text
}

/**
 * Test function (run directly via node)
 */
async function test() {
    try {
        console.log("--- Starting Test ---");
        const testMessage = `Hello, Ethereum! 🚀 - ${new Date().toISOString()}`;
        console.log("Original message:", testMessage);
        
        // Send transaction
        const result = await sendMessageTransaction(testMessage);
        console.log("Transaction successful:", {
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            cost: result.costEth + " ETH"
        });

        // Retrieve and decode message
        const retrievedMessage = await getMessageFromTx(result.txHash);
        console.log("Retrieved message:", retrievedMessage);
    } catch (err) {
        console.error("Test Failed:", err);
        process.exit(1);
    }
}

// Run test if executed directly
if (require.main === module) test();

module.exports = {
    sendMessageTransaction,
    getMessageFromTx,
    checkBalance,
    encodeMessage,
    decodeMessage
};