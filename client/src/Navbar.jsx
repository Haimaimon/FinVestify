import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Newspaper } from 'lucide-react';
import Button from '@mui/material/Button';
import { Favorite } from '@material-ui/icons';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import axios from 'axios';
import '../src/index.css';

export default function Navbar({ openAuthForm, isLoggedIn, handleLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate(); // שימוש ב-useNavigate

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false); // סגירת התפריט בלחיצה על קישור
  };

  const handleLogoutAndRedirect = () => {
    handleLogout(); // קריאה לפונקציית הלוגאוט שמגיעה מה-props
    navigate('/'); // הפניה לדף הבית
  };

  const handleSearchChange = async (e) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); // רק אותיות גדולות באנגלית
    setSearchTerm(input);

    if (input.length > 0) {
      try {
        const response = await axios.get(`http://localhost:5658/api/suggestions?query=${input}`);
        setSuggestions(response.data);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSearchSelect = (symbol,) => {
    setSearchTerm(symbol);
    setSuggestions([]);
    navigate(`/search?query=${symbol}`); // הפניה לעמוד החיפוש
  };

  const handleSearchSubmit = () => {
    navigate(`/search?query=${searchTerm}`);
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
            <Link to="/predictstock" onClick={handleLinkClick}>Predict Stock</Link>
            <Link to="/strategytrade" onClick={handleLinkClick}>Strategy Trade</Link>
            <Link to="/portfolio" onClick={handleLinkClick}>Portfolio</Link>
            <Link to="/about" onClick={handleLinkClick}>About</Link>
          </div>
        )}
      </div>
      <div className="navbar-center" style={{ position: 'relative' }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search stock..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mr: 1 }}
        />
        {suggestions.length > 0 && (
          <List
            sx={{
              position: 'absolute',
              top: '40px',
              left: 0,
              right: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: 'darksalmon',
              border: '1px solid #ffffff',
              zIndex: 1000,
            }}
          >
            {suggestions.map((suggestion, index) => (
              <ListItem
                button
                key={index}
                onClick={() => handleSearchSelect(suggestion.Symbol)}
              >
                <ListItemText primary={`${suggestion.Symbol} - ${suggestion.Sector}`} />
              </ListItem>
            ))}
          </List>
        )}
        <IconButton onClick={handleSearchSubmit} color="primary">
          <SearchIcon />
        </IconButton>
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
            <Link to="/sentiment">
              <Button variant="outlined" startIcon={<Newspaper />}>
                Senti
              </Button>
            </Link>
            <Link to="/stocknews">
              <Button variant="outlined" startIcon={<Newspaper />}>
                Stock News
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outlined" startIcon={<User />}>
                MyProfile
              </Button>
            </Link>
            <Button onClick={handleLogoutAndRedirect} variant="outlined" startIcon={<LogOut />}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
