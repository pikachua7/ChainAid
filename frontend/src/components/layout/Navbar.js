import React, { useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { GlobalContext } from '../context/GlobalProvider';

function Navbar({ loading, currentNetwork, portis, reset }) {
    const navigate = useHistory();
    const { walletAddress, setWalletAddress } = useContext(GlobalContext);

    const handleLogout = async () => {
        if (portis) await portis.logout();
        setWalletAddress("");
        reset();
        navigate.push('/');
    }

    return (
        <nav className="navbar navbar-expand-md navbar-light bg-light">
            <div className="container">
                <Link className="navbar-brand text-secondary-color" to="/">
                    <img className="logo" src="/images/logo.png" alt="Logo" />
                </Link>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item" data-toggle="collapse" data-target=".navbar-collapse.show">
                            <Link className="nav-link text-primary-color" to="/">Home</Link>
                        </li>
                        {walletAddress &&
                            <li className="nav-item" data-toggle="collapse" data-target=".navbar-collapse.show">
                                <Link className="nav-link text-primary-color" to="/mytokens">My Tokens</Link>
                            </li>
                        }
                        {walletAddress &&
                            <li className="nav-item" data-toggle="collapse" data-target=".navbar-collapse.show">
                                <Link className="nav-link text-primary-color" to="/add-ngo">Add ngos</Link>
                            </li>
                        }
                    </ul>
                    <ul className="navbar-nav">
                        <li className="nav-item d-flex align-items-center" data-toggle="collapse" data-target=".navbar-collapse.show">
                            {walletAddress && <span className="badge badge-warning">{currentNetwork === 'MATIC' ? 'Matic' : 'Kovan'} TestNet</span>}
                            {walletAddress ? <a
                                target="_blank"
                                className="nav-link text-primary-color"
                                rel="noopener noreferrer"
                                href={currentNetwork === 'MATIC' ? "https://explorer-mumbai.maticvigil.com/address/" + walletAddress : "https://kovan.etherscan.io/address/" + walletAddress}>
                                {walletAddress.substring(0, 5)}...{walletAddress.substring(37, 42)}
                            </a> : <button className="btn secondary-bg-color" data-toggle="modal" data-target="#walletModal" disabled={loading}>Open Wallet</button>
                            }
                        </li>
                        {walletAddress &&
                            <li className="nav-item" data-toggle="collapse" data-target=".navbar-collapse.show">
                                <button className="btn btn-danger" onClick={() => handleLogout()}>Disconnect Wallet</button>
                            </li>
                        }
                    </ul>
                </div>

            </div>

        </nav>
    );
};

export default Navbar;