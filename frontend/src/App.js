import React, { Component } from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import Web3 from 'web3';

//Context
import { GlobalProvider } from './components/context/GlobalProvider';

//Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AddNgo from './components/AddNgo';
import Ngo from './components/Ngo';
import Ngos from './components/Ngos';
import WalletModal from './components/WalletModal';


//Smart Contracts
import NGO from './abis/NGO.json';
import Token from './abis/Token.json';


class App extends Component {
  state = {
    account: '',
    ngoCount: 0,
    totalCount: 0,
    ngoContract: null,
    ngoAddress: "",
    tokenContract: null,
    ngoList: [],
    checkoutList: [],
    tokensList: [],
    ethPrice: 0,
    currentNetwork: "MATIC",
    loading: false,

  }

  //Connection to Wallet
  async connectToBlockchain(walletType) {
    if (walletType === 'Metamask') {
      await this.loadWeb3();
    }

    await this.loadBlockchainData(walletType);
    await this.getNgos();

    const ethValue = await this.getPrice();
    this.setState({ ethPrice: ethValue });
  }

  async loadBlockchainData(walletType) {
    let web3;
    if (walletType === 'Metamask') {
      web3 = window.web3;
    }
    else {
      //Any other wallet
    }

    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    console.log(this.state.account);

    const networkId = await web3.eth.net.getId();

    //Token Contract

    const TokenData = Token.networks[networkId];

    if (TokenData) {
      const abi = Token.abi;
      const address = Token.networks[networkId].address;
      const tokenContract = new web3.eth.Contract(abi, address);
      this.setState({ tokenContract });
    }
    else {
      window.alert('Token Contract not deployed to detected network');
    }

    //NGO contract
    const networkData = await NGO.networks[networkId];

    if (networkData) {
      const abi = NGO.abi;
      const address = NGO.networks[networkId].address;
      this.setState({ ngoAddress: address });

      const ngoContract = new web3.eth.Contract(abi, address);
      this.setState({ ngoContract });

      const ngoCount = await ngoContract.methods.ngoCount().call();
      this.setState({ ngoCount });

      const totalCount = await ngoContract.methods.fetchNfts().call();
      this.setState({ totalCount: totalCount });

      for (let i = 1; i <= totalCount; i++) {
        const tokenOwner = await ngoContract.methods.ownerOf(i).call();
        if (tokenOwner === accounts[0]) {
          let tokenURI = await ngoContract.methods.tokenURI(i).call();
          let data = await ngoContract.methods.nft(i).call();
          this.setState({
            tokensList: [...this.state.tokensList, {
              id: i,
              tokenURI,
              name: data.name,
              red: data.red,
              green: data.green,
              blue: data.blue,
              prize: data.prize
            }]
          });
        }
      }
    }
    else {
      window.alert('NGO Contract not deployed to detected network');
    }
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async getNGOs() {
    for (let i = 0; i < this.state.ngoCount; i++) {
      const ngo = await this.state.ngoContract.methods.ngoList(i + 1).call();
      this.setState({ ngoList: [...this.state.ngoList, ngo] });
    }
  }

  async createNGO(name, description, imageURL, fund) {
    const data = await this.state.ngoContract.methods.createNGO(name, description, imageURL, window.web3.utils.toWei(fund.toString(), 'Ether')).send({ from: this.state.account });
    this.setState({ ngoList: [...this.state.ngoList, data.events.NgoCreated.returnValues] });
  }

  async paymentwithReward(id, fund, imageURL, ngoName) {
    const res = await this.state.ngoContract.methods.paymentwithReward(id, imageURL).send({ from: this.state.account, value: window.web3.utils.toWei(fund.toString(), 'Ether') });
    //doubt
    console.log(res);
    const ngoId = res.events.Transfer.returnValues.tokenId; //tokenId
    console.log(ngoId);
    const tokenURI = await this.state.ngoContract.methods.tokenURI(ngoId).call();
    console.log(tokenURI);
    const data = await this.state.ngoContract.methods.rewards(ngoId).call();
    console.log(data);
    const newToken = {
      id: ngoId,
      name: ngoName,
      tokenURI,
      red: data.red,
      green: data.green,
      blue: data.blue,
      prize: window.web3.utils.toWei(fund.toString(), 'Ether')
    }
    console.log(newToken);
    this.setState({
      tokensList: [...this.state.tokensList, newToken]
    });

    return newToken;
  }

  async getBill(itemId) {
    const transaction = await this.state.ngoContract?.getPastEvents('Transactions', { fromBlock: 0, toBlock: 'latest' });
    this.setState({ checkoutList: transaction?.filter(transaction => transaction.returnValues.itemId === itemId) });
  }

  async changeRewardColor(nftId) {
    const res = await this.state.ngoContract.methods.changeRewardColor(nftId).send({ from: this.state.account });
    let temp = [...this.state.tokensList];
    for (let token of temp) {
      if (token.id === nftId) {
        token.red = res.events.RGBColor.returnValues.red;
        token.green = res.events.RGBColor.returnValues.green;
        token.blue = res.events.RGBColor.returnValues.blue;
      }
    }
    this.setState({ tokensList: [...temp] });
  }

  async getPrice() {
    console.log(this.state.ngoContract);
    const ethPrice = await this.state.ngoContract.methods.getLatestPrice().call();
    return ethPrice;
  }

  setLoading() {
    this.setState({ loading: !this.state.loading })
  }

  reset() {
    this.setState({
      ngoList: [],
      checkoutList: [],
      tokensList: []
    })
  }

  changeNetwork(value) {
    this.setState({ currentNetwork: value });
  }

  render() {
    return (
      <GlobalProvider>
        <Router>
          <Navbar loading={this.state.loading} currentNetwork={this.state.currentNetwork} reset={this.reset.bind(this)} />
          <Route exact path="/" element={<Ngos loading={this.state.loading} ngoList={this.state.ngoList} ethPrice={this.state.ethPrice} ngoAddress={this.state.ngoAddress} currentNetwork={this.state.currentNetwork} />} />
          <Route exact path="/addNgo" element={<AddNgo createNgo={this.createNGO.bind(this)} getPrice={this.getPrice.bind(this)} currentNetwork={this.state.currentNetwork} />} />
          <Route exact path="/ngo/:id" element={<Ngo account={this.state.account} ngoList={this.state.ngoList} checkoutList={this.state.checkoutList} paymentwithReward={this.paymentwithReward.bind(this)} getPrice={this.getPrice.bind(this)} ethPrice={this.state.ethPrice} currentNetwork={this.state.currentNetwork} />} />
          <WalletModal connectToBlockchain={this.connectToBlockchain.bind(this)} changeNetwork={this.changeNetwork.bind(this)} setLoading={this.setLoading.bind(this)} />
        </Router>
      </GlobalProvider>
    )
  }
}

export default App;
