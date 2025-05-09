import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './UserDashboard.css';

const UserDashboard = ({ walletAddress, contract }) => {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Produce states
  const [produceState, setProduceState] = useState({
    data: [],
    loading: false,
    error: null,
    currentPage: 1,
    recordsPerPage: 5
  });

  // Sales states
  const [salesState, setSalesState] = useState({
    history: [],
    loading: false,
    error: null,
    currentPage: 1,
    recordsPerPage: 5
  });

  // Stock alerts
  const [lowStockThreshold] = useState(5);
  const [stockAlerts, setStockAlerts] = useState([]);

  // Forms
  const [produceForm, setProduceForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    harvestDate: ''
  });

  const [saleForm, setSaleForm] = useState({
    produceId: '',
    quantity: '',
    buyerName: '',
    buyerPhone: '',
    price: '',
    date: ''
  });

  const [profileForm, setProfileForm] = useState({
    farmName: '',
    location: '',
    contactInfo: ''
  });

  // Analytics
  const [analyticsData, setAnalyticsData] = useState({
    monthlyIncome: 0,
    yearlyIncome: 0,
    bestSellingProduce: []
  });

  // Ledger
  const [ledgerState, setLedgerState] = useState({
    data: [],
    loading: false,
    error: null,
    currentPage: 1,
    recordsPerPage: 5
  });

  // Helper functions
  const checkLowStock = (produce) => {
    return produce.quantity <= lowStockThreshold;
  };

  const userData = localStorage.getItem(`user_${walletAddress}`) 
    ? JSON.parse(localStorage.getItem(`user_${walletAddress}`))
    : { phoneNumber: "Not available" };

  // Data fetching
  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const data = await contract.farmers(walletAddress);
        setFarmerData(data);
        setProfileForm({
          farmName: data.name || '',
          location: data.location || '',
          contactInfo: data.contactInfo || ''
        });
      } catch (err) {
        console.error("Error fetching farmer data:", err);
      }
    };

    fetchFarmerData();
  }, [walletAddress, contract]);

  useEffect(() => {
    if (activeTab === 'my-produce') {
      fetchMyProduce();
    } else if (activeTab === 'sales-history') {
      fetchSalesHistory();
    } else if (activeTab === 'analytics-reports') {
      calculateAnalytics();
    } else if (activeTab === 'blockchain-ledger') {
      fetchLedgerData();
    }
  }, [activeTab, contract]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaleInputChange = (e) => {
    const { name, value } = e.target;
    setSaleForm(prev => ({ ...prev, [name]: value }));
  };

  // Core functions
  const handlePostProduce = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const priceInWei = ethers.parseEther(produceForm.price.toString());

      const tx = await contract.addProduce(
        produceForm.name,
        produceForm.category,
        priceInWei,
        produceForm.quantity,
        produceForm.harvestDate,
        "" // imageHash placeholder
      );

      await tx.wait();

      setSuccess("Produce added successfully!");
      setProduceForm({
        name: '',
        category: '',
        price: '',
        quantity: '',
        harvestDate: ''
      });
      fetchMyProduce();
    } catch (err) {
      console.error("Error adding produce:", err);
      setError(`Failed to add produce: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!contract) {
      alert('Contract not initialized.');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.recordSale(
        saleForm.produceId,
        saleForm.quantity,
        saleForm.buyerName,
        saleForm.buyerPhone,
        ethers.parseEther(saleForm.price.toString())
      );
      await tx.wait();
      setSuccess('Sale recorded successfully!');
      setSaleForm({
        produceId: '',
        quantity: '',
        buyerName: '',
        buyerPhone: '',
        price: '',
        date: ''
      });
      fetchSalesHistory();
    } catch (err) {
      console.error('Error recording sale:', err);
      setError(`Failed to record sale: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (produceId) => {
    const newQuantity = prompt("Enter new quantity:");
    if (newQuantity && !isNaN(newQuantity)) {
      try {
        const tx = await contract.updateProduceQuantity(produceId, newQuantity);
        await tx.wait();
        fetchMyProduce();
        setSuccess("Stock updated successfully!");
      } catch (err) {
        console.error("Error updating stock:", err);
        setError(`Failed to update stock: ${err.message}`);
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await contract.updateFarmerProfile(
        profileForm.farmName,
        profileForm.location,
        profileForm.contactInfo
      );

      await tx.wait();

      const storedData = JSON.parse(localStorage.getItem(`user_${walletAddress}`));
      localStorage.setItem(`user_${walletAddress}`, JSON.stringify({
        ...storedData,
        farmName: profileForm.farmName,
        location: profileForm.location,
        contactInfo: profileForm.contactInfo
      }));

      setSuccess("Profile updated successfully!");
      const data = await contract.farmers(walletAddress);
      setFarmerData(data);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Data fetching functions
  const fetchMyProduce = async () => {
    if (!contract || !walletAddress) return;
    setProduceState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const count = await contract.produceCount(walletAddress);
      const produceList = [];
      
      for (let i = 0; i < Number(count); i++) {
        const produce = await contract.farmerProduce(walletAddress, i);
        produceList.push({
          id: i,
          name: produce.name,
          category: produce.category,
          price: produce.price,
          quantity: produce.quantity,
          harvestDate: produce.harvestDate,
          imageHash: produce.imageHash,
          isAvailable: produce.isAvailable,
        });
      }
      
      setProduceState(prev => ({ ...prev, data: produceList }));
      setStockAlerts(produceList.filter(checkLowStock));
    } catch (err) {
      setProduceState(prev => ({ ...prev, error: "Failed to fetch produce listings." }));
      console.error(err);
    } finally {
      setProduceState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchSalesHistory = async () => {
    if (!contract) return;
    setSalesState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const salesData = await contract.getAllSales();
      const formattedSales = salesData.map(sale => ({
        produceId: sale.produceId,
        quantity: sale.quantity,
        buyerName: sale.buyerName,
        buyerPhone: sale.buyerPhone,
        price: sale.price,
        timestamp: new Date(Number(sale.timestamp) * 1000).toLocaleString()
      }));
      
      setSalesState(prev => ({ ...prev, history: formattedSales }));
    } catch (err) {
      setSalesState(prev => ({ ...prev, error: 'Failed to fetch sales history.' }));
    } finally {
      setSalesState(prev => ({ ...prev, loading: false }));
    }
  };

  const calculateAnalytics = async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    
    try {
      const salesData = await contract.getAllSales();
      
      // Calculate monthly and yearly income
      const currentDate = new Date();
      const monthlyIncome = salesData
        .filter(sale => new Date(sale.timestamp * 1000).getMonth() === currentDate.getMonth())
        .reduce((sum, sale) => sum + Number(sale.price), 0);
        
      const yearlyIncome = salesData
        .filter(sale => new Date(sale.timestamp * 1000).getFullYear() === currentDate.getFullYear())
        .reduce((sum, sale) => sum + Number(sale.price), 0);
      
      // Calculate best selling produce
      const produceSales = {};
      salesData.forEach(sale => {
        if (!produceSales[sale.produceId]) {
          produceSales[sale.produceId] = {
            quantity: 0,
            totalSales: 0
          };
        }
        produceSales[sale.produceId].quantity += Number(sale.quantity);
        produceSales[sale.produceId].totalSales += Number(sale.price);
      });
      
      const bestSelling = Object.entries(produceSales)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5);
      
      setAnalyticsData({
        monthlyIncome,
        yearlyIncome,
        bestSellingProduce: bestSelling
      });
    } catch (err) {
      setError('Failed to calculate analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerData = async () => {
    if (!contract) return;
    setLedgerState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const salesData = await contract.getAllSales();
      const produceData = await Promise.all(
        salesData.map(async sale => {
          const produce = await contract.farmerProduce(walletAddress, sale.produceId);
          return {
            ...sale,
            produceName: produce.name
          };
        })
      );
      
      const formattedData = produceData.map(sale => ({
        produceName: sale.produceName,
        quantity: sale.quantity,
        price: sale.price,
        timestamp: new Date(Number(sale.timestamp) * 1000).toLocaleString(),
        buyerName: sale.buyerName,
        buyerPhone: sale.buyerPhone
      }));
      
      setLedgerState(prev => ({ ...prev, data: formattedData }));
    } catch (err) {
      setLedgerState(prev => ({ ...prev, error: 'Failed to fetch ledger data.' }));
    } finally {
      setLedgerState(prev => ({ ...prev, loading: false }));
    }
  };

  // Pagination functions
  const handleProducePageChange = (pageNumber) => {
    setProduceState(prev => ({ ...prev, currentPage: pageNumber }));
  };

  const handleSalesPageChange = (pageNumber) => {
    setSalesState(prev => ({ ...prev, currentPage: pageNumber }));
  };

  const handleLedgerPageChange = (pageNumber) => {
    setLedgerState(prev => ({ ...prev, currentPage: pageNumber }));
  };

  // Calculate pagination data
  const producePagination = {
    indexOfLastRecord: produceState.currentPage * produceState.recordsPerPage,
    indexOfFirstRecord: produceState.currentPage * produceState.recordsPerPage - produceState.recordsPerPage,
    totalPages: Math.ceil(produceState.data.length / produceState.recordsPerPage),
    currentRecords: produceState.data.slice(
      produceState.currentPage * produceState.recordsPerPage - produceState.recordsPerPage,
      produceState.currentPage * produceState.recordsPerPage
    )
  };

  const salesPagination = {
    indexOfLastRecord: salesState.currentPage * salesState.recordsPerPage,
    indexOfFirstRecord: salesState.currentPage * salesState.recordsPerPage - salesState.recordsPerPage,
    totalPages: Math.ceil(salesState.history.length / salesState.recordsPerPage),
    currentRecords: salesState.history.slice(
      salesState.currentPage * salesState.recordsPerPage - salesState.recordsPerPage,
      salesState.currentPage * salesState.recordsPerPage
    )
  };

  const ledgerPagination = {
    indexOfLastRecord: ledgerState.currentPage * ledgerState.recordsPerPage,
    indexOfFirstRecord: ledgerState.currentPage * ledgerState.recordsPerPage - ledgerState.recordsPerPage,
    totalPages: Math.ceil(ledgerState.data.length / ledgerState.recordsPerPage),
    currentRecords: ledgerState.data.slice(
      ledgerState.currentPage * ledgerState.recordsPerPage - ledgerState.recordsPerPage,
      ledgerState.currentPage * ledgerState.recordsPerPage
    )
  };

  // UI helpers
  const handleDownloadReceipt = (sale) => {
    const receipt = `
      Sale Receipt
      ----------------------------
      Produce ID: ${sale.produceId}
      Quantity: ${sale.quantity}
      Buyer: ${sale.buyerName}
      Phone: ${sale.buyerPhone}
      Price: ${ethers.formatEther(sale.price)} ETH
      Date: ${sale.timestamp}
    `;
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${sale.produceId}_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="dashboard-tabs">
          {['dashboard', 'profile', 'post-produce', 'my-produce', 'record-sale', 'sales-history', 'track-stock', 'analytics-reports', 'blockchain-ledger'].map(tab => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <h2>Farmer Dashboard</h2>
            <div className="user-info">
              <p><strong>Wallet Address:</strong> {walletAddress}</p>
              <p><strong>Contact Info:</strong> {farmerData ? farmerData.contactInfo : "Not available"}</p>
              {farmerData && <p><strong>Farm Name:</strong> {farmerData.name}</p>}
            </div>
            
            <div className="dashboard-stats">
              <div className="stat-card">
                <h4>Active Listings</h4>
                <p className="stat-value">{produceState.data.filter(p => p.isAvailable).length}</p>
              </div>
              <div className="stat-card">
                <h4>Total Sales</h4>
                <p className="stat-value">{salesState.history.length}</p>
              </div>
              <div className="stat-card">
                <h4>Low Stock Alerts</h4>
                <p className="stat-value">{stockAlerts.length}</p>
              </div>
              <div className="stat-card">
                <h4>Monthly Revenue</h4>
                <p className="stat-value">{ethers.formatEther(analyticsData.monthlyIncome)} ETH</p>
              </div>
            </div>
            
            {stockAlerts.length > 0 && (
              <div className="alerts-section">
                <h3>Low Stock Alerts</h3>
                <ul>
                  {stockAlerts.map((alert, idx) => (
                    <li key={idx}>
                      {alert.name} - Only {alert.quantity.toString()} left!
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-form">
            <h3>Update Profile</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="farmName">Farm Name</label>
                <input type="text" id="farmName" name="farmName" value={profileForm.farmName} onChange={handleProfileInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input type="text" id="location" name="location" value={profileForm.location} onChange={handleProfileInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="contactInfo">Contact Info</label>
                <input type="text" id="contactInfo" name="contactInfo" value={profileForm.contactInfo} onChange={handleProfileInputChange} required />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? "Updating..." : "Update Profile"}
              </button>

              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </form>
          </div>
        )}

        {/* Post Produce Tab */}
        {activeTab === 'post-produce' && (
          <div className="post-produce-form">
            <h3>Post Produce for Sale</h3>
            <form onSubmit={handlePostProduce}>
              <div className="form-group">
                <label htmlFor="name">Item Name</label>
                <input type="text" id="name" name="name" value={produceForm.name} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={produceForm.category} onChange={handleInputChange} required>
                  <option value="">Select Category</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                  <option value="dairy">Dairy</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (ETH)</label>
                <input type="number" id="price" name="price" step="0.001" value={produceForm.price} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity (kg)</label>
                <input type="number" id="quantity" name="quantity" value={produceForm.quantity} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="harvestDate">Harvest Date</label>
                <input type="date" id="harvestDate" name="harvestDate" value={produceForm.harvestDate} onChange={handleInputChange} required />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? "Processing..." : "Post Produce"}
              </button>

              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </form>
          </div>
        )}

        {/* My Produce Tab */}
        {activeTab === 'my-produce' && (
          <div className="my-produce-listings">
            <h3>My Produce Listings</h3>
            {produceState.loading && <p>Loading...</p>}
            {produceState.error && <p className="error-message">{produceState.error}</p>}
            
            {produceState.data.length === 0 && !produceState.loading && !produceState.error && (
              <p>No produce listings found.</p>
            )}
            
            {produceState.data.length > 0 && (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price (Wei)</th>
                      <th>Quantity</th>
                      <th>Harvest Date</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producePagination.currentRecords.map((produce, idx) => (
                      <tr key={produce.id}>
                        <td>{producePagination.indexOfFirstRecord + idx + 1}</td>
                        <td>{produce.name}</td>
                        <td>{produce.category}</td>
                        <td>{produce.price.toString()}</td>
                        <td>{produce.quantity.toString()}</td>
                        <td>{produce.harvestDate}</td>
                        <td>{produce.isAvailable ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="pagination">
                  {Array.from({ length: producePagination.totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={produceState.currentPage === i + 1 ? "active" : ""}
                      onClick={() => handleProducePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Record Sale Tab */}
        {activeTab === 'record-sale' && (
          <div className="record-sale-form">
            <h3>Record Manual Sales</h3>
            <form onSubmit={handleRecordSale}>
              <div className="form-group">
                <label htmlFor="produceId">Produce Name</label>
                <select 
                  id="produceId" 
                  name="produceId" 
                  value={saleForm.produceId} 
                  onChange={handleSaleInputChange} 
                  required
                >
                  <option value="">Select Produce</option>
                  {produceState.data.map(produce => (
                    <option key={produce.id} value={produce.id}>{produce.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input 
                  type="number" 
                  id="quantity" 
                  name="quantity" 
                  value={saleForm.quantity} 
                  onChange={handleSaleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="buyerName">Buyer Name</label>
                <input 
                  type="text" 
                  id="buyerName" 
                  name="buyerName" 
                  value={saleForm.buyerName} 
                  onChange={handleSaleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="buyerPhone">Buyer Phone</label>
                <input 
                  type="text" 
                  id="buyerPhone" 
                  name="buyerPhone" 
                  value={saleForm.buyerPhone} 
                  onChange={handleSaleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (ETH)</label>
                <input 
                  type="number" 
                  id="price" 
                  name="price" 
                  step="0.001"
                  value={saleForm.price} 
                  onChange={handleSaleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input 
                  type="date" 
                  id="date" 
                  name="date" 
                  value={saleForm.date} 
                  onChange={handleSaleInputChange} 
                  required 
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? "Processing..." : "Record Sale"}
              </button>

              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </form>
          </div>
        )}

        {/* Sales History Tab */}
        {activeTab === 'sales-history' && (
          <div className="sales-history">
            <h3>Sales History</h3>
            {salesState.loading && <p>Loading sales history...</p>}
            {salesState.error && <p className="error-message">{salesState.error}</p>}
            
            {salesState.history.length === 0 && !salesState.loading && !salesState.error && (
              <p>No sales history found.</p>
            )}
            
            {salesState.history.length > 0 && (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Produce ID</th>
                      <th>Quantity</th>
                      <th>Buyer Name</th>
                      <th>Buyer Phone</th>
                      <th>Price (ETH)</th>
                      <th>Timestamp</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesPagination.currentRecords.map((sale, idx) => (
                      <tr key={idx}>
                        <td>{sale.produceId}</td>
                        <td>{sale.quantity}</td>
                        <td>{sale.buyerName}</td>
                        <td>{sale.buyerPhone}</td>
                        <td>{ethers.formatEther(sale.price)}</td>
                        <td>{sale.timestamp}</td>
                        <td>
                          <button 
                            className="download-btn"
                            onClick={() => handleDownloadReceipt(sale)}
                          >
                            Download Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="pagination">
                  {Array.from({ length: salesPagination.totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={salesState.currentPage === i + 1 ? "active" : ""}
                      onClick={() => handleSalesPageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Track Stock Tab */}
        {activeTab === 'track-stock' && (
          <div className="track-stock">
            <h3>Track Stock</h3>
            {produceState.loading && <p>Loading stock data...</p>}
            {produceState.error && <p className="error-message">{produceState.error}</p>}
            
            {produceState.data.length === 0 && !produceState.loading && !produceState.error && (
              <p>No produce listings found.</p>
            )}
            
            {produceState.data.length > 0 && (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produceState.data.map((produce, idx) => (
                      <tr 
                        key={produce.id} 
                        className={checkLowStock(produce) ? 'low-stock' : ''}
                      >
                        <td>{idx + 1}</td>
                        <td>{produce.name}</td>
                        <td>{produce.category}</td>
                        <td>{produce.quantity.toString()}</td>
                        <td>
                          {checkLowStock(produce) ? (
                            <span className="stock-alert">Low Stock</span>
                          ) : (
                            <span className="stock-normal">In Stock</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="update-stock-btn"
                            onClick={() => handleUpdateStock(produce.id)}
                          >
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Analytics Reports Tab */}
        {activeTab === 'analytics-reports' && (
          <div className="analytics-reports">
            <h3>Analytics & Reports</h3>
            {loading && <p>Loading analytics...</p>}
            {error && <p className="error-message">{error}</p>}
            
            <div className="analytics-summary">
              <div className="analytics-card">
                <h4>Monthly Income</h4>
                <p className="analytics-value">
                  {ethers.formatEther(analyticsData.monthlyIncome)} ETH
                </p>
              </div>
              <div className="analytics-card">
                <h4>Yearly Income</h4>
                <p className="analytics-value">
                  {ethers.formatEther(analyticsData.yearlyIncome)} ETH
                </p>
              </div>
              <div className="analytics-card">
                <h4>Total Sales</h4>
                <p className="analytics-value">
                  {salesState.history.length}
                </p>
              </div>
              <div className="analytics-card">
                <h4>Active Listings</h4>
                <p className="analytics-value">
                  {produceState.data.filter(p => p.isAvailable).length}
                </p>
              </div>
            </div>
            
            <div className="best-selling">
              <h4>Best Selling Produce</h4>
              {analyticsData.bestSellingProduce.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Produce ID</th>
                      <th>Total Quantity Sold</th>
                      <th>Total Sales (ETH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.bestSellingProduce.map(([produceId, data]) => (
                      <tr key={produceId}>
                        <td>{produceId}</td>
                        <td>{data.quantity}</td>
                        <td>{ethers.formatEther(data.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No sales data available</p>
              )}
            </div>
          </div>
        )}

        {/* Blockchain Ledger Tab */}
        {activeTab === 'blockchain-ledger' && (
          <div className="blockchain-ledger">
            <h3>Blockchain Ledger</h3>
            {ledgerState.loading && <p>Loading ledger data...</p>}
            {ledgerState.error && <p className="error-message">{ledgerState.error}</p>}
            
            <div className="ledger-info">
              <p>All transactions are securely recorded on the blockchain and cannot be altered.</p>
            </div>
            
            {ledgerState.data.length > 0 ? (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Produce Name</th>
                      <th>Quantity</th>
                      <th>Price (ETH)</th>
                      <th>Timestamp</th>
                      <th>Buyer Name</th>
                      <th>Buyer Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerPagination.currentRecords.map((transaction, idx) => (
                      <tr key={idx}>
                        <td>{transaction.produceName}</td>
                        <td>{transaction.quantity}</td>
                        <td>{ethers.formatEther(transaction.price)}</td>
                        <td>{transaction.timestamp}</td>
                        <td>{transaction.buyerName}</td>
                        <td>{transaction.buyerPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="pagination">
                  {Array.from({ length: ledgerPagination.totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={ledgerState.currentPage === i + 1 ? "active" : ""}
                      onClick={() => handleLedgerPageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p>No transactions found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;