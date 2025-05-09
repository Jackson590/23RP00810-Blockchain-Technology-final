# Blockchain-Based Farm Produce Sale Log

## 📌 Project Overview

This project is a decentralized web-based platform that allows farmers to securely log and manage the sale of their farm produce using blockchain technology. It enhances transparency, trust, and financial tracking by offering tamper-proof records of all transactions.

---

## 🚜 Problem Statement

Many smallholder farmers lack secure and efficient methods to record their produce sales. Manual records are prone to loss and manipulation, making it difficult for farmers to track income, resolve disputes, or access loans that require verifiable financial data.

---

## 🎯 Objective

To build a blockchain-powered sales logging platform that empowers farmers to:
- Record every produce sale securely.
- Monitor produce stock levels.
- Generate immutable digital receipts.
- Analyze income trends through a visual dashboard.

---

## 🔑 Key Features

- **Farmer Authentication:** Secure login and profile management.
- **Produce Management:** Add, edit, and remove produce inventory.
- **Sale Logging:** Record sale transactions with quantity, buyer info, and price.
- **Blockchain Integration:** Each sale is logged immutably on the Ethereum blockchain.
- **Sales History:** View and export previous transactions.
- **Reports & Analytics:** Graphs and summaries showing trends and top-selling items.
- **Low Stock Alerts:** Automatic notifications when produce stock is running low.

---

## 🛠️ Tech Stack

### Frontend:
- React.js  
- MetaMask (for wallet connection)

### Backend:
- Node.js + Express.js / Flask (Python)
- MongoDB / PostgreSQL

### Blockchain:
- Ethereum (Testnet: e.g., Goerli or Sepolia)
- Solidity (Smart Contracts)
- Hardhat / Truffle (Development and Testing)

### Dev Tools:
- IPFS (optional, for storing receipts)
- Web3.js / Ethers.js

---

## 🔒 Security Measures

- Smart contract audit using Slither/MythX
- HTTPS and token-based authentication
- Input validation and rate limiting
- Role-based access control for different users
- Wallet transaction verification and confirmation

---

## 📅 Implementation Plan

| Day | Task | Deliverables |
|-----|------|--------------|
| Day 1 | Setup & Planning | Dev environment, repo, architecture design |
| Day 2 | Smart Contract Development | Core Solidity contract for sales logging |
| Day 3 | Frontend Development | UI components for produce & sales management |
| Day 4 | Backend Development | REST API, DB schema, authentication |
| Day 5 | Blockchain Integration | Smart contract + frontend/backend linkage |
| Day 6 | Security Testing | Penetration testing & smart contract audit |
| Day 7 | Deployment | Full-stack deployment + documentation |

---

## 📂 Folder Structure

```
farm-produce-log/
│
├── contracts/           # Solidity smart contracts
├── frontend/            # React frontend
├── backend/             # Node.js or Flask backend
├── scripts/             # Deployment and test scripts
├── docs/                # Project documentation
├── README.md
└── hardhat.config.js    # Hardhat/Truffle config
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/farm-produce-log.git
cd farm-produce-log
```

### 2. Install dependencies
```bash
npm install     # For frontend
pip install -r requirements.txt  # If using Flask backend
```

### 3. Compile & deploy smart contracts
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network goerli
```

### 4. Start the app
```bash
# Frontend
cd frontend
npm start

# Backend
cd backend
npm start  # or python app.py
```

---

## 👨‍🌾 Author

**Tuyisenge Jackson**  
BTech-IT, Year Four  
Reg. Number: 23RP00810

---

## 📜 License

This project is for academic purposes and does not yet include a production-ready license.
