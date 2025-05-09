import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import './App.css';
import FarmProduceSaleLogABI from '../artifacts/contracts/FarmProduceSaleLog.sol/FarmProduceSaleLog.json';
import UserDashboard from './UserDashboard';

const CONTRACT_ADDRESS = '0x610178dA211FEF7D417bC0e6FeD39F05609AD788';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for form inputs
  const nameRef = useRef(null);
  const contactInfoRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    if (walletConnected && window.ethereum) {
      initializeContract();
    }
  }, [walletConnected]);

  const initializeContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const farmContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FarmProduceSaleLogABI.abi,
        signer
      );
      setContract(farmContract);
      checkUserRegistration(farmContract);
    } catch (err) {
      console.error("Error initializing contract:", err);
      setError("Failed to initialize contract. Please refresh and try again.");
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
        } else {
          throw new Error("No accounts found");
        }
      } else {
        alert("Please install MetaMask to connect your wallet!");
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkUserRegistration = async (activeContract) => {
    try {
      if (!activeContract || !walletAddress) return;

      const farmerData = await activeContract.farmers(walletAddress);
      if (farmerData.isRegistered) {
        setUserRegistered(true);
        setShowRegistration(false);
      } else {
        setUserRegistered(false);
        setShowRegistration(true);
      }
    } catch (err) {
      console.error("Error checking registration:", err);
      setShowRegistration(true);
    }
  };

  const handleRegisterFarmer = async () => {
    const name = nameRef.current.value.trim();
    const contactInfo = contactInfoRef.current.value.trim();
    const location = locationRef.current.value.trim();

    if (!name || !contactInfo || !location) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.registerFarmer(name, contactInfo, location);
      await tx.wait();

      setUserRegistered(true);
      setShowRegistration(false);
    } catch (err) {
      console.error("Error registering farmer:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const RegistrationForm = () => (
    <div className="top-container">
      <fieldset className="fieldset">
        <legend>Farmer Registration</legend>
        <h2>Register as a Farmer</h2>
        <p>Please fill in your information below:</p>

        <label>Name</label>
        <input
          type="text"
          placeholder="Full Name"
          ref={nameRef}
          className="FarmerRegister"
          required
        />

        <label>Contact Info</label>
        <input
          type="tel"
          placeholder="0788123456"
          ref={contactInfoRef}
          className="FarmerRegister"
          pattern="^\+?[0-9\s\-]{10,15}$"
          required
        />

        <label>Location</label>
        <input
          type="text"
          placeholder="Farm Location"
          ref={locationRef}
          className="FarmerRegister"
          required
        />

        <button
          className="register-button"
          onClick={handleRegisterFarmer}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {error && <p className="error-message">{error}</p>}
      </fieldset>
    </div>
  );

  const WelcomeScreen = () => (
    <div className="top-container">
      <fieldset className="fieldset">
        <legend>Wallet Connection</legend>
        <h1>Welcome to Farm Produce Sale Log</h1>
        <p>Connect your wallet to access your dashboard</p>
        <button className="connect-button" onClick={connectWallet}>
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </fieldset>
    </div>
  );

  return (
    <div className="app-container">
      {!walletConnected && <WelcomeScreen />}
      {walletConnected && showRegistration && <RegistrationForm />}
      {walletConnected && userRegistered && (
        <UserDashboard walletAddress={walletAddress} contract={contract} />
      )}
    </div>
  );
}

export default App;
