import React,{ useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, User ,LogOut} from 'lucide-react';
import Button from '@mui/material/Button';
import { Favorite } from '@material-ui/icons';
import '../src/index.css';

export default function Navbar({ openAuthForm, isLoggedIn, handleLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
  
    const handleToggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };
  
    const handleLinkClick = () => {
      setIsMenuOpen(false); // סגירת התפריט בלחיצה על קישור
    };
  
    return (
      <nav className="navbar">
        <div className="navbar-left">
          <Button onClick={handleToggleMenu}>
            <Menu />
          </Button>
          {isMenuOpen && (
            <div className="menu">
              <Link to="/" onClick={handleLinkClick}>Home</Link>
              <Link to="/news" onClick={handleLinkClick}>News</Link>
              <Link to="/stockdata" onClick={handleLinkClick}>StockData</Link>
              <Link to="/stockpredict" onClick={handleLinkClick}>Stock Predict</Link>
              <Link to="/strategytrade" onClick={handleLinkClick}>Strategy Trade</Link>
              <Link to="/portfolio" onClick={handleLinkClick}>Portfolio</Link>
              <Link to="/about" onClick={handleLinkClick}>About</Link>
            </div>
          )}
        </div>
        <div className="navbar-right">
          {!isLoggedIn ? (
            <>
              <Button variant="outlined" onClick={() => openAuthForm('login')}>Login</Button>
              <Button variant="contained" onClick={() => openAuthForm('register')}>Register</Button>
            </>
          ) : (
            <div className="profile">
              <Link to="/favorites">
                <Button variant="outlined" startIcon={<Favorite />}>
                  Favorites
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outlined" startIcon={<User />}>
                  MyProfile
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outlined" startIcon={<LogOut/>}>Logout</Button>
            </div>
          )}
        </div>
      </nav>
    );
  }