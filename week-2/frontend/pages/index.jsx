import abi from '../utils/BuyMeACoffee.json';
import { ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  // Contract Address & ABI
  const contractAddress = '0x71202fd966B83230C7792b5D162717bda94c81B3';
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [memos, setMemos] = useState([]);
  const [isOwnerConnected, setIsOwnerConnected] = useState(false);

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  };

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      console.log('accounts: ', accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log('wallet is connected! ' + account);

        const provider = new ethers.providers.Web3Provider(ethereum, 'any');
        const buyMeACoffee = new ethers.Contract(contractAddress, contractABI, provider.getSigner());

        const contractOwner = await buyMeACoffee.owner();
        if (account === contractOwner.toLowerCase()) {
          setIsOwnerConnected(true);
          console.log('wallet is owner');
        }
      } else {
        console.log('make sure MetaMask is connected');
      }
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('please install MetaMask');
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const buyCoffee = async (amountEth = '0.001') => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, 'any');
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

        console.log('buying coffee..');
        const coffeeTxn = await buyMeACoffee.buyCoffee(name ? name : 'anon', message ? message : 'Enjoy your coffee!', {
          value: ethers.utils.parseEther(amountEth),
        });

        await coffeeTxn.wait();

        console.log('mined ', coffeeTxn.hash);

        console.log('coffee purchased!');

        // Clear the form fields.
        // setName("");
        setMessage('');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

        console.log('fetching memos from the blockchain..');
        const memos = await buyMeACoffee.getMemos();
        console.log('fetched!');
        setMemos(memos);
      } else {
        console.log('Metamask is not connected');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withdrawTips = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, 'any');
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

        console.log('withdrawing tips...');

        const withdrawTxn = await buyMeACoffee.withdrawTips();
        await withdrawTxn.wait();

        console.log('mined ', withdrawTxn.hash);
        console.log('Funds withdrawn');
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, amount, name, message) => {
      console.log('Memo received: ', from, timestamp, amount, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          amount,
          message,
          name,
        },
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, 'any');
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

      buyMeACoffee.on('NewMemo', onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off('NewMemo', onNewMemo);
      }
    };
  }, []);

  const showBuyForm = (
    <div>
      <form>
        <div>
          <label>Name</label>
          <br />

          <input id="name" type="text" placeholder="anon" onChange={onNameChange} />
        </div>
        <br />
        <div>
          <label>Send Marvin a message</label>
          <br />

          <textarea
            rows={3}
            placeholder="Enjoy your coffee!"
            id="message"
            onChange={onMessageChange}
            required
          ></textarea>
        </div>
        <div>
          <button type="button" onClick={() => buyCoffee('0.001')}>
            Send a Small Coffee for 0.001ETH
          </button>
        </div>
        <div>
          <button type="button" onClick={() => buyCoffee('0.002')}>
            Send a Medium Coffee for 0.002ETH
          </button>
        </div>
        <div>
          <button type="button" onClick={() => buyCoffee('0.003')}>
            Send a Large Coffee for 0.003ETH
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy Marvin a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Buy Marvin a Coffee!</h1>

        {currentAccount ? showBuyForm : <button onClick={connectWallet}> Connect your wallet </button>}
      </main>

      {currentAccount && isOwnerConnected && <button onClick={withdrawTips}>Withdraw Tips</button>}

      {currentAccount && <h1>Memos received</h1>}

      {currentAccount &&
        memos.map((memo, idx) => {
          return (
            <div key={idx} style={{ border: '2px solid', borderRadius: '5px', padding: '5px', margin: '5px' }}>
              <p>
                <span style={{ fontWeight: 'bold' }}>{memo.message}</span>
                <span> ({ethers.utils.formatEther(memo.amount)} ETH)</span>
              </p>
              <p>
                From: {memo.name} at {memo.timestamp.toString()}
              </p>
            </div>
          );
        })}

      <footer className={styles.footer}>
        <a href="https://alchemy.com/?a=roadtoweb3weektwo" target="_blank" rel="noopener noreferrer">
          Created by Marvin for Alchemy's Road to Web3 lesson two!
        </a>
      </footer>
    </div>
  );
}
