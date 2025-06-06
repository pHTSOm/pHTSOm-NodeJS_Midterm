import React, { useRef, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./header.css";
import { motion } from "framer-motion";
import logo from "../../assets/images/eco-logo.png";
import userIcon from "../../assets/images/user-icon.png";
import { Container, Row } from "reactstrap";
import { useSelector } from "react-redux";
import { AuthService } from "../../services/api";

const Header = () => {
  const headerRef = useRef(null);
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // Add state for authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is logged in and is admin
  useEffect(() => {
    const checkAuthStatus = () => {
      const loggedIn = AuthService.isLoggedIn();
      const admin = AuthService.isAdmin();
      
      console.log('Auth status:', { loggedIn, admin });
      console.log('User from localStorage:', localStorage.getItem('user'));
      
      setIsLoggedIn(loggedIn);
      setIsAdmin(admin);
    };
    
    // Check initially
    checkAuthStatus();
    
    // Set up a storage event listener to detect changes
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(checkAuthStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const stickyHeaderFunc = () => {
    window.addEventListener("scroll", () => {
      if (
        document.body.scrollTop > 80 ||
        document.documentElement.scrollTop > 80
      ) {
        headerRef.current.classList.add("sticky__header");
      } else {
        headerRef.current.classList.remove("sticky__header");
      }
    });
  };

  useEffect(() => {
    stickyHeaderFunc();
    return () => window.removeEventListener("scroll", stickyHeaderFunc);
  });

  const menuToggle = () => menuRef.current.classList.toggle("active__menu");

  const navigateToHome = () =>{
    navigate("/home")
  };

  const navigateToCart = () => {
    navigate("/cart");
  };

  const navigateToAdminDashboard = () => {
    navigate("/admin/dashboard");
  };

  // Navigate to login 
  const navigateToLogin = () => {
    navigate("/login");
  };
  
  // Handle logout
  const handleLogout = () => {
    AuthService.logout();
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate("/home");
  };

  // Filter navigation links based on user role
  const nav__links = [
    {
      path: "home",
      display: "Home",
    },
    {
      path: "shop",
      display: "Shop",
    },
    {
      path: "cart",
      display: "Cart",
    }
  ];
  
  // Only add AdminDashboard link if user is admin
  if (isLoggedIn && isAdmin) {    
    nav__links.push({
      path: "/admin/dashboard",
      display: "Admin Dashboard",
    });
  }

  return (
    <header className="header" ref={headerRef}>
      <Container>
        <Row>
          <div className="nav__wrapper">
            <div className="logo">
              <img src={logo} alt="logo" />
              <div>
                <h1 onClick={navigateToHome}>Frontiers</h1>
              </div>
            </div>

            <div className="navigation" ref={menuRef} onClick={menuToggle}>
              <ul className="menu">
                {nav__links.map((item, index) => (
                  <li className="nav__item" key={index}>
                    <NavLink
                      to={item.path}
                      className={(navClass) =>
                        navClass.isActive ? "nav__active" : ""
                      }
                    >
                      {item.display}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav__icons">
              <span className="fav__icon">
                <i className="ri-heart-line"></i>
                <span className="badge">0</span>
              </span>
              <span className="cart__icon" onClick={navigateToCart}>
                <i className="ri-shopping-bag-line"></i>
                <span className="badge">{totalQuantity}</span>
              </span>

              <span className="user__icon">
                <motion.img 
                  whileTap={{ scale: 1.2 }} 
                  src={userIcon} 
                  alt="" 
                  onClick={isLoggedIn ? null : navigateToLogin}
                />
                
                {isLoggedIn && (
                    <div className="user__dropdown">
                      <span className="user__dropdown-item" onClick={() => navigate("/profile")}>
                        <i className="ri-user-line me-2"></i>
                        My Profile
                      </span>
                      <span className="user__dropdown-item" onClick={() => navigate("/orders")}>
                        <i className="ri-file-list-line me-2"></i>
                        My Orders
                      </span>
                      {isAdmin && (
                        <span className="user__dropdown-item" onClick={navigateToAdminDashboard}>
                          <i className="ri-dashboard-line me-2"></i>
                          Admin Dashboard
                        </span>
                      )}
                    <span className="user__dropdown-item" onClick={handleLogout}>
                        <i className="ri-logout-box-line me-2"></i>
                      Logout
                    </span>
                  </div>
                )}
              </span>
              
              <div className="mobile__menu">
                <span onClick={menuToggle}>
                  <i className="ri-menu-line"></i>
                </span>
              </div>
            </div>
          </div>
        </Row>
      </Container>
    </header>
  );
};

export default Header;