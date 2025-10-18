// ELYSIAN - Luxury Emergency Response System
// Application State Management & Router

class ElysianApp {
  constructor() {
    this.state = {
      currentUser: null,
      isAuthenticated: false,
      currentRoute: 'login',
      isEmergencyActive: false,
      isVoiceListening: false,
      chatbotOpen: false,
      speechRecognition: null
    };

    // User data simulation (replaces localStorage)
    this.userData = {
      users: [
        { 
          email: 'sanjay@elysian.com', 
          password: 'Demo123!',
          name: 'Sanjay Kumar',
          phone: '+91-9876543210',
          medicalProfile: {
            bloodType: 'O+',
            allergies: ['Penicillin', 'Peanuts'],
            medications: ['Lisinopril 10mg', 'Aspirin 81mg'],
            conditions: ['Hypertension', 'Diabetes Type 2'],
            emergencyContact: {
              name: 'John Doe',
              relationship: 'Spouse',
              phone: '+91-9876543210'
            },
            notes: 'History of heart disease. Prefers Apollo Hospital.'
          }
        }
      ],
      currentSession: null
    };

    this.routes = {
      login: { title: 'Login - ELYSIAN', requiresAuth: false },
      signup: { title: 'Sign Up - ELYSIAN', requiresAuth: false },
      forgot: { title: 'Reset Password - ELYSIAN', requiresAuth: false },
      home: { title: 'Home - ELYSIAN', requiresAuth: true },
      emergency: { title: 'Emergency - ELYSIAN', requiresAuth: true },
      voice: { title: 'Voice Activation - ELYSIAN', requiresAuth: true },
      medical: { title: 'Medical Profile - ELYSIAN', requiresAuth: true },
      services: { title: 'Emergency Services - ELYSIAN', requiresAuth: true },
      profile: { title: 'Profile - ELYSIAN', requiresAuth: true }
    };

    this.services = {
      ambulances: [
        { name: 'Emergency Ambulance Unit A1', status: 'Available', distance: '1.3 km', eta: '3 min', phone: '+91-9876543211' },
        { name: 'Emergency Ambulance Unit B2', status: 'Busy', distance: '2.1 km', eta: '5 min', phone: '+91-9876543212' }
      ],
      hospitals: [
        { name: 'Apollo Hospital', status: 'Available', distance: '2.3 km', eta: '8 min', phone: '+91-80-26304050' },
        { name: 'Fortis Hospital', status: 'Available', distance: '3.1 km', eta: '12 min', phone: '+91-80-66214444' },
        { name: 'Manipal Hospital', status: 'Available', distance: '4.2 km', eta: '15 min', phone: '+91-80-25023344' },
        { name: 'Columbia Asia Hospital', status: 'Busy', distance: '5.0 km', eta: '18 min', phone: '+91-80-39896969' }
      ]
    };

    this.lexoraResponses = {
      greeting: "Hello Sanjay 👑, I'm Lexora — your AI Guardian. How may I assist you today?",
      sos: "To activate emergency services, use the voice command 'emergency1234' on the Voice page or press the SOS button for voice activation prompt. Your location and medical information will be automatically shared with emergency services for fastest response.",
      medical: "You can view and update your medical profile on the Medical page. Your current information shows blood type O+, allergies to Penicillin and Peanuts, and current medication Lisinopril 10mg. Would you like to modify any information?",
      voice: "Go to the Voice page, click the microphone, and speak 'emergency1234' clearly to activate emergency services hands-free. This security code ensures only authorized emergency activation.",
      services: "Visit the Services page to see available ambulances and nearby hospitals. Apollo Hospital is 2.3km away and available. Emergency Ambulance Unit A1 is 1.3km away with 3-minute ETA. Would you like me to connect you?",
      help: "I'm here to assist with emergency activation, voice commands, medical profile updates, or emergency services information. Ask me anything about ELYSIAN's luxury emergency response features! 👑"
    };

    this.init();
  }

  init() {
    this.hideLoadingScreen();
    this.setupEventListeners();
    this.initializeSpeechRecognition();
    this.route(this.state.currentRoute);
  }

  hideLoadingScreen() {
    setTimeout(() => {
      document.getElementById('loadingScreen').classList.add('hidden');
    }, 2000);
  }

  setupEventListeners() {
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      this.route(e.state?.route || 'login', false);
    });

    // Navigation click handlers
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-route')) {
        e.preventDefault();
        this.route(e.target.getAttribute('data-route'));
      }
    });

    // Form submissions
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      const formId = e.target.id;
      
      switch(formId) {
        case 'loginForm':
          this.handleLogin(e.target);
          break;
        case 'signupForm':
          this.handleSignup(e.target);
          break;
        case 'forgotForm':
          this.handleForgotPassword(e.target);
          break;
      }
    });

    // Chatbot handlers
    document.getElementById('chatbotToggle').addEventListener('click', () => {
      this.toggleChatbot();
    });

    document.getElementById('closeChatbot').addEventListener('click', () => {
      this.closeChatbot();
    });

    document.getElementById('sendChatBtn').addEventListener('click', () => {
      this.sendChatMessage();
    });

    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendChatMessage();
      }
    });

    // Voice chat button
    document.getElementById('voiceChatBtn').addEventListener('click', () => {
      this.activateVoiceInput();
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape key closes modals
      if (e.key === 'Escape') {
        this.closeChatbot();
        this.closeEmergencyModal();
        this.closeVoiceModal();
      }
      
      // Ctrl/Cmd + E for emergency (prevent default)
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (this.state.isAuthenticated) {
          this.route('emergency');
        }
      }
    });
  }

  // Router Implementation
  route(routeName, addToHistory = true) {
    if (!this.routes[routeName]) {
      routeName = 'login';
    }

    const route = this.routes[routeName];
    
    // Check authentication
    if (route.requiresAuth && !this.state.isAuthenticated) {
      this.route('login');
      return;
    }

    this.state.currentRoute = routeName;
    
    if (addToHistory) {
      history.pushState({ route: routeName }, route.title, `#${routeName}`);
    }

    document.title = route.title;
    this.renderPage(routeName);
  }

  renderPage(routeName) {
    const appContainer = document.getElementById('app');
    
    switch(routeName) {
      case 'login':
        appContainer.innerHTML = this.renderLoginPage();
        break;
      case 'signup':
        appContainer.innerHTML = this.renderSignupPage();
        break;
      case 'forgot':
        appContainer.innerHTML = this.renderForgotPage();
        break;
      case 'home':
        appContainer.innerHTML = this.renderDashboard() + this.renderHomePage();
        break;
      case 'emergency':
        appContainer.innerHTML = this.renderDashboard() + this.renderEmergencyPage();
        break;
      case 'voice':
        appContainer.innerHTML = this.renderDashboard() + this.renderVoicePage();
        break;
      case 'medical':
        appContainer.innerHTML = this.renderDashboard() + this.renderMedicalPage();
        break;
      case 'services':
        appContainer.innerHTML = this.renderDashboard() + this.renderServicesPage();
        break;
      case 'profile':
        appContainer.innerHTML = this.renderDashboard() + this.renderProfilePage();
        break;
      default:
        appContainer.innerHTML = this.renderLoginPage();
    }

    this.attachPageEventListeners(routeName);
  }

  renderDashboard() {
    const user = this.state.currentUser;
    return `
      <nav class="nav-header">
        <div class="nav-container">
          <div class="nav-menu">
            <button class="nav-item ${this.state.currentRoute === 'home' ? 'active' : ''}" data-route="home">Home</button>
            <button class="nav-item ${this.state.currentRoute === 'emergency' ? 'active' : ''}" data-route="emergency">Emergency</button>
            <button class="nav-item ${this.state.currentRoute === 'voice' ? 'active' : ''}" data-route="voice">Voice</button>
            <button class="nav-item ${this.state.currentRoute === 'medical' ? 'active' : ''}" data-route="medical">Medical</button>
            <button class="nav-item ${this.state.currentRoute === 'services' ? 'active' : ''}" data-route="services">Services</button>
            <button class="nav-item ${this.state.currentRoute === 'profile' ? 'active' : ''}" data-route="profile">Profile</button>
          </div>
          
          <div class="nav-logo">
            <div class="logo-symbol">⚕️</div>
            <h1 class="logo-text">ELYSIAN</h1>
          </div>
          
          <div class="nav-actions">
            <span style="color: var(--deep-crimson); font-weight: 600; margin-right: 1rem;">👤 ${user.name}</span>
            <button class="btn outline" onclick="app.logout()">Logout</button>
          </div>
        </div>
      </nav>
    `;
  }

  renderLoginPage() {
    return `
      <div class="auth-page">
        <div class="glass-card auth-card">
          <div class="auth-logo">
            <div class="caduceus-symbol">⚕️</div>
            <h1 class="app-title">ELYSIAN</h1>
            <p class="page-subtitle">Royal Luxury Emergency Response System</p>
          </div>
          
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <input type="email" class="form-control" placeholder="Email address" required>
            </div>
            <div class="form-group">
              <input type="password" class="form-control" placeholder="Password" required>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="rememberMe">
                <span class="checkmark"></span>
                Remember me
              </label>
            </div>
            <button type="submit" class="btn primary large" style="width: 100%;">Login to ELYSIAN</button>
          </form>
          
          <div class="auth-links">
            <a href="#" class="auth-link" data-route="forgot">Forgot Password?</a>
            <p class="signup-text">Don't have an account? <a href="#" class="auth-link" data-route="signup">Sign Up</a></p>
          </div>
        </div>
      </div>
    `;
  }

  renderSignupPage() {
    return `
      <div class="auth-page">
        <div class="glass-card auth-card">
          <div class="auth-logo">
            <div class="caduceus-symbol">⚕️</div>
            <h1 class="app-title">ELYSIAN</h1>
            <p class="page-subtitle">Create Your Account</p>
          </div>
          
          <form id="signupForm" class="auth-form">
            <div class="form-group">
              <input type="text" class="form-control" placeholder="Full Name" required>
            </div>
            <div class="form-group">
              <input type="email" class="form-control" placeholder="Email address" required>
            </div>
            <div class="form-group">
              <input type="password" class="form-control" placeholder="Password" required minlength="8">
            </div>
            <div class="form-group">
              <input type="password" class="form-control" placeholder="Confirm Password" required>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" required>
                <span class="checkmark"></span>
                I'm not a robot 🤖
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" required>
                <span class="checkmark"></span>
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            <button type="submit" class="btn primary large" style="width: 100%;">Create Account</button>
          </form>
          
          <div class="auth-links">
            <p class="signup-text">Already have an account? <a href="#" class="auth-link" data-route="login">Login</a></p>
          </div>
        </div>
      </div>
    `;
  }

  renderForgotPage() {
    return `
      <div class="auth-page">
        <div class="glass-card auth-card">
          <div class="auth-logo">
            <div class="caduceus-symbol">⚕️</div>
            <h1 class="app-title">ELYSIAN</h1>
            <p class="page-subtitle">Reset Your Password</p>
          </div>
          
          <form id="forgotForm" class="auth-form">
            <div class="form-group">
              <input type="email" class="form-control" placeholder="Enter your email address" required>
            </div>
            <button type="submit" class="btn primary large" style="width: 100%;">Send Reset Link</button>
          </form>
          
          <div class="auth-links">
            <a href="#" class="auth-link" data-route="login">← Back to Login</a>
          </div>
        </div>
      </div>
    `;
  }

  renderHomePage() {
    const user = this.state.currentUser;
    return `
      <div class="page active">
        <div class="page-content">
          <div class="container">
            <div class="page-header">
              <h1 class="page-title" style="font-size: 3.5rem; background: linear-gradient(135deg, var(--deep-crimson) 0%, var(--soft-gold) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Welcome to ELYSIAN 👑</h1>
              <p class="page-subtitle" style="font-size: 1.3rem; color: var(--deep-crimson); font-weight: 500;">Your AI Guardian — Royal Luxury Emergency Response System</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 3rem;">
              
              <div class="glass-card" style="cursor: pointer; transition: all 0.3s ease;" onclick="app.route('emergency')">
                <div style="text-align: center; padding: 1rem;">
                  <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--deep-crimson);">🚨</div>
                  <h3 style="color: var(--deep-crimson); font-family: var(--font-display); margin-bottom: 1rem;">Emergency SOS</h3>
                  <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">Instant emergency activation with voice security and real-time tracking</p>
                  <div class="btn primary" style="width: 100%; border: none;">Access Emergency</div>
                </div>
              </div>
              
              <div class="glass-card" style="cursor: pointer; transition: all 0.3s ease;" onclick="app.route('voice')">
                <div style="text-align: center; padding: 1rem;">
                  <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--soft-gold);">🎤</div>
                  <h3 style="color: var(--deep-crimson); font-family: var(--font-display); margin-bottom: 1rem;">Voice Activation</h3>
                  <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">Hands-free emergency activation using secure voice recognition</p>
                  <div class="btn secondary" style="width: 100%; border: none;">Voice Commands</div>
                </div>
              </div>
              
              <div class="glass-card" style="cursor: pointer; transition: all 0.3s ease;" onclick="app.route('medical')">
                <div style="text-align: center; padding: 1rem;">
                  <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--deep-crimson);">👥</div>
                  <h3 style="color: var(--deep-crimson); font-family: var(--font-display); margin-bottom: 1rem;">Medical Profile</h3>
                  <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">Manage your medical information and emergency contacts</p>
                  <div class="btn outline" style="width: 100%; border: 2px solid var(--deep-crimson);">View Profile</div>
                </div>
              </div>
              
              <div class="glass-card" style="cursor: pointer; transition: all 0.3s ease;" onclick="app.route('services')">
                <div style="text-align: center; padding: 1rem;">
                  <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--soft-gold);">🏥</div>
                  <h3 style="color: var(--deep-crimson); font-family: var(--font-display); margin-bottom: 1rem;">Emergency Services</h3>
                  <p style="color: #666; margin-bottom: 1.5rem; line-height: 1.6;">Access nearby ambulances and hospitals with live availability</p>
                  <div class="btn secondary" style="width: 100%; border: none;">View Services</div>
                </div>
              </div>
              
            </div>
            
            <div style="text-align: center; margin: 3rem 0; padding: 2rem; background: rgba(212, 175, 55, 0.1); border-radius: 15px; border: 1px solid rgba(212, 175, 55, 0.3);">
              <h4 style="color: var(--deep-crimson); font-family: var(--font-display); margin-bottom: 1rem;">👑 Royal Guardian Features</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                <div style="text-align: center;">
                  <div style="color: var(--soft-gold); font-size: 1.5rem; margin-bottom: 0.5rem;">⚡</div>
                  <p style="margin: 0; color: var(--deep-crimson); font-weight: 500;">Instant Activation</p>
                </div>
                <div style="text-align: center;">
                  <div style="color: var(--soft-gold); font-size: 1.5rem; margin-bottom: 0.5rem;">🔐</div>
                  <p style="margin: 0; color: var(--deep-crimson); font-weight: 500;">Voice Security</p>
                </div>
                <div style="text-align: center;">
                  <div style="color: var(--soft-gold); font-size: 1.5rem; margin-bottom: 0.5rem;">📍</div>
                  <p style="margin: 0; color: var(--deep-crimson); font-weight: 500;">Live Tracking</p>
                </div>
                <div style="text-align: center;">
                  <div style="color: var(--soft-gold); font-size: 1.5rem; margin-bottom: 0.5rem;">🤖</div>
                  <p style="margin: 0; color: var(--deep-crimson); font-weight: 500;">AI Assistant</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }

  renderEmergencyPage() {
    return `
      <div class="page active">
        <div class="page-content">
          <div class="container">
            <div class="emergency-layout">
              <div class="glass-card">
                <h2 style="color: var(--deep-crimson); margin-bottom: 1rem; font-family: var(--font-display); font-size: 2rem;">🚨 Emergency SOS</h2>
                <p style="color: var(--deep-crimson); font-size: 1.1rem; margin-bottom: 2rem; font-weight: 500;">Press for immediate emergency assistance</p>
                
                <div class="sos-container">
                  <button class="sos-button" onclick="app.activateSOS()">
                    <div class="sos-ring"></div>
                    <div class="sos-center">SOS</div>
                  </button>
                  <p style="text-align: center; color: #666; margin: 2rem 0; font-style: italic;">🔐 Security required: Use voice command for activation</p>
                  <button class="btn secondary" data-route="voice" style="background: linear-gradient(135deg, var(--soft-gold) 0%, #b8941f 100%);">🎤 Use Voice Command</button>
                </div>
              </div>
              
              <div class="glass-card">
                <h3 style="color: var(--soft-gold); margin-bottom: 1rem;">Location Services</h3>
                
                <div style="background: rgba(59, 130, 246, 0.1); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid rgba(59, 130, 246, 0.2);">
                  <p style="color: #1e40af; font-size: 0.9rem; margin: 0;">📍 Your location will be shared with emergency services</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                  <h4 style="color: var(--deep-crimson); margin-bottom: 0.5rem;">Location Detected</h4>
                  <p style="font-weight: 600; color: var(--deep-crimson); margin: 0;">Bangalore, Karnataka, India</p>
                  <p style="font-family: monospace; color: #666; margin: 0.5rem 0;">12.971600, 77.594600</p>
                  <button class="btn outline" style="width: 100%; margin-top: 1rem;" onclick="app.updateLocation()">📍 Update Location</button>
                </div>
                
                <div class="map-container">
                  <div class="map-placeholder">
                    <div class="map-icon">🗺️</div>
                    <p style="margin: 0; font-weight: 600;">Live Location Map</p>
                    <p style="margin: 0; font-size: 0.9rem;">Bangalore, Karnataka</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderVoicePage() {
    return `
      <div class="page active">
        <div class="page-content">
          <div class="container">
            <div class="page-header">
              <h1 class="page-title">Voice Emergency Activation</h1>
              <p class="page-subtitle">Speak the security code to activate emergency services</p>
            </div>
            
            <div class="glass-card voice-interface">
              <button class="voice-button" onclick="app.startVoiceRecognition()">
                🎤
              </button>
              
              <div class="voice-status" id="voiceStatus">
                Click microphone to start listening
              </div>
              
              <div style="background: rgba(212, 175, 55, 0.1); border-radius: var(--border-radius-sm); padding: 1.5rem; margin-top: 2rem; text-align: left; border: 1px solid rgba(212, 175, 55, 0.3);">
                <h4 style="color: var(--deep-crimson); margin-bottom: 1rem;">🔐 Voice Security Information</h4>
                <p style="margin: 0.5rem 0; color: #666;">• Your security code is voice-activated only</p>
                <p style="margin: 0.5rem 0; color: #666;">• Speak clearly: <strong>"emergency1234"</strong></p>
                <p style="margin: 0.5rem 0; color: #666;">• This ensures security and hands-free operation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderMedicalPage() {
    const user = this.state.currentUser;
    const medical = user.medicalProfile;
    
    return `
      <div class="page active">
        <div class="page-content">
          <div class="container">
            <div class="page-header">
              <h1 class="page-title">Medical Information</h1>
              <p class="page-subtitle">Your medical data for emergency services</p>
            </div>
            
            <div class="glass-card">
              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 10px; padding: 1rem; margin-bottom: 2rem; text-align: center; border: 1px solid rgba(59, 130, 246, 0.2);">
                <p style="color: #1e40af; margin: 0; font-size: 0.9rem;">ℹ️ This information will be automatically shared with emergency services during SOS activation</p>
              </div>
              
              <div class="medical-grid">
                <div class="medical-item">
                  <label class="medical-label">Blood Type:</label>
                  <span class="badge blood">${medical.bloodType}</span>
                </div>
                
                <div class="medical-item">
                  <label class="medical-label">Allergies:</label>
                  <div>
                    ${medical.allergies.map(allergy => `<span class="badge allergy">${allergy}</span>`).join('')}
                  </div>
                </div>
                
                <div class="medical-item">
                  <label class="medical-label">Current Medications:</label>
                  <div>
                    ${medical.medications.map(med => `<span class="badge medication">${med}</span>`).join('')}
                  </div>
                </div>
                
                <div class="medical-item">
                  <label class="medical-label">Medical Conditions:</label>
                  <div>
                    ${medical.conditions.map(condition => `<span class="badge condition">${condition}</span>`).join('')}
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--glass-border);">
                <h4 style="color: var(--soft-gold); margin-bottom: 1rem; font-family: var(--font-display);">Emergency Contact</h4>
                <div style="background: rgba(212, 175, 55, 0.1); border-radius: 10px; padding: 1rem; border: 1px solid rgba(212, 175, 55, 0.3);">
                  <p style="font-weight: 600; color: var(--deep-crimson); margin: 0;">👤 ${medical.emergencyContact.name} (${medical.emergencyContact.relationship})</p>
                  <p style="color: #666; font-family: monospace; margin: 0.5rem 0 0 0;">📞 ${medical.emergencyContact.phone}</p>
                </div>
              </div>
              
              <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--glass-border);">
                <h4 style="color: var(--deep-crimson); margin-bottom: 0.75rem;">Additional Notes:</h4>
                <p style="color: #666; line-height: 1.6; font-style: italic; margin: 0;">${medical.notes}</p>
              </div>
              
              <div class="text-center" style="margin-top: 2rem;">
                <button class="btn secondary" onclick="app.editMedicalProfile()">✏️ Edit Medical Profile</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderServicesPage() {
    return `
      <div class="page active">
        <div class="page-content">
          <div class="container">
            <div class="page-header">
              <h1 class="page-title">Emergency Services</h1>
              <p class="page-subtitle">Available ambulances and nearby hospitals</p>
            </div>
            
            <!-- Ambulances Section -->
            <div style="margin-bottom: 3rem;">
              <h3 style="color: var(--deep-crimson); margin-bottom: 1.5rem; font-size: 1.5rem; font-family: var(--font-display);">🚑 Available Ambulances</h3>
              <div class="services-grid">
                ${this.services.ambulances.map(ambulance => `
                  <div class="glass-card service-card ${ambulance.status.toLowerCase()}">
                    <div class="service-header">
                      <div class="service-info">
                        <h4>${ambulance.name}</h4>
                        <p style="color: #666; margin: 0; font-size: 0.9rem;">Mobile Emergency Unit</p>
                      </div>
                      <span class="service-status ${ambulance.status.toLowerCase()}">${ambulance.status}</span>
                    </div>
                    <div class="service-footer">
                      <div class="service-details">
                        <p style="margin: 0;">📍 Distance: ${ambulance.distance}</p>
                        <p style="margin: 0;">🕐 ETA: ${ambulance.eta}</p>
                      </div>
                      <button class="btn ${ambulance.status === 'Available' ? 'primary' : 'outline'}" onclick="app.callService('${ambulance.phone}', '${ambulance.name}')" ${ambulance.status === 'Busy' ? 'disabled' : ''}>
                        ${ambulance.status === 'Available' ? '📞 Call Now' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Hospitals Section -->
            <div>
              <h3 style="color: var(--deep-crimson); margin-bottom: 1.5rem; font-size: 1.5rem; font-family: var(--font-display);">🏥 Nearby Hospitals</h3>
              <div class="services-grid">
                ${this.services.hospitals.map(hospital => `
                  <div class="glass-card service-card ${hospital.status.toLowerCase()}">
                    <div class="service-header">
                      <div class="service-info">
                        <h4>${hospital.name}</h4>
                        <p style="color: #666; margin: 0; font-size: 0.9rem;">Emergency Department</p>
                      </div>
                      <span class="service-status ${hospital.status.toLowerCase()}">${hospital.status}</span>
                    </div>
                    <div class="service-footer">
                      <div class="service-details">
                        <p style="margin: 0;">📍 Distance: ${hospital.distance}</p>
                        <p style="margin: 0;">🕐 ETA: ${hospital.eta}</p>
                      </div>
                      <button class="btn ${hospital.status === 'Available' ? 'primary' : 'outline'}" onclick="app.callService('${hospital.phone}', '${hospital.name}')" ${hospital.status === 'Busy' ? 'disabled' : ''}>
                        ${hospital.status === 'Available' ? '🏥 Call Hospital' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderProfilePage() {
    const user = this.state.currentUser;
    
    return `
      <div class="page active">
        <div class="page-content">
          <div class="container">
            <div class="profile-header">
              <div class="profile-avatar">👤</div>
              <h1 class="profile-name">${user.name}</h1>
              <p class="profile-email">${user.email}</p>
            </div>
            
            <div class="glass-card">
              <h3 style="color: var(--deep-crimson); margin-bottom: 1.5rem; font-family: var(--font-display);">Account Information</h3>
              
              <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="form-group">
                  <label class="form-label">Full Name:</label>
                  <input type="text" class="form-control" value="${user.name}" readonly style="background: rgba(0,0,0,0.05);">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Email Address:</label>
                  <input type="email" class="form-control" value="${user.email}" readonly style="background: rgba(0,0,0,0.05);">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Phone Number:</label>
                  <input type="tel" class="form-control" value="${user.phone}">
                </div>
                
                <div style="padding-top: 1.5rem; border-top: 1px solid var(--glass-border);">
                  <h4 style="color: var(--deep-crimson); margin-bottom: 1rem;">Account Settings</h4>
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <button class="btn outline" style="justify-content: flex-start;">🔒 Change Password</button>
                    <button class="btn outline" style="justify-content: flex-start;">🔔 Notification Settings</button>
                    <button class="btn outline" style="justify-content: flex-start;">🛡️ Privacy Settings</button>
                  </div>
                </div>
                
                <div style="padding-top: 1.5rem; border-top: 1px solid var(--glass-border); text-center;">
                  <button class="btn primary" onclick="app.logout()" style="background: #dc2626; width: 100%;">🚪 Logout</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachPageEventListeners(routeName) {
    // Page-specific event listeners are attached here
    // This ensures events work after route changes
  }

  // Authentication Methods
  handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email') || form.querySelector('input[type="email"]').value;
    const password = formData.get('password') || form.querySelector('input[type="password"]').value;

    // Find user in mock database
    const user = this.userData.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.state.isAuthenticated = true;
      this.state.currentUser = user;
      this.userData.currentSession = user;
      
      this.showNotification('Login successful! Welcome to ELYSIAN', 'success');
      this.route('home');
    } else {
      this.showNotification('Invalid credentials. Please try again.', 'error');
    }
  }

  handleSignup(form) {
    const formData = new FormData(form);
    const name = form.querySelector('input[placeholder="Full Name"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value;
    
    // Basic validation
    if (password !== confirmPassword) {
      this.showNotification('Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 8) {
      this.showNotification('Password must be at least 8 characters', 'error');
      return;
    }
    
    // Check if user already exists
    const existingUser = this.userData.users.find(u => u.email === email);
    if (existingUser) {
      this.showNotification('Email already registered', 'error');
      return;
    }
    
    // Create new user
    const newUser = {
      email,
      password,
      name,
      phone: '+91-9876543210',
      medicalProfile: {
        bloodType: '',
        allergies: [],
        medications: [],
        conditions: [],
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        },
        notes: ''
      }
    };
    
    this.userData.users.push(newUser);
    
    // Auto-login after signup
    this.state.isAuthenticated = true;
    this.state.currentUser = newUser;
    this.userData.currentSession = newUser;
    
    this.showNotification('Account created successfully! Welcome to ELYSIAN', 'success');
    this.route('home');
  }

  handleForgotPassword(form) {
    const email = form.querySelector('input[type="email"]').value;
    this.showNotification(`Password reset link sent to ${email}`, 'success');
    
    setTimeout(() => {
      this.route('login');
    }, 2000);
  }

  logout() {
    this.state.isAuthenticated = false;
    this.state.currentUser = null;
    this.userData.currentSession = null;
    this.closeChatbot();
    
    this.showNotification('Logged out successfully', 'success');
    this.route('login');
  }

  // Emergency Functions
  activateSOS() {
    if (!this.state.isAuthenticated) {
      this.showNotification('Please log in to access emergency services', 'error');
      return;
    }

    // Show confirmation modal first, then require voice activation
    const confirmed = confirm('⚠️ Activate Emergency SOS?\n\nYour location and medical information will be shared with emergency services.\n\nClick OK to proceed to voice verification.');
    
    if (confirmed) {
      this.showNotification('🔐 Voice security verification required for your safety', 'info');
      setTimeout(() => {
        this.showNotification('Please use voice command "emergency1234" for activation', 'info');
      }, 1500);
      this.route('voice');
    }
  }

  showEmergencyModal() {
    document.getElementById('emergencyActiveModal').classList.remove('hidden');
    this.state.isEmergencyActive = true;
    
    // Simulate ambulance ETA countdown
    let eta = 6;
    const countdown = setInterval(() => {
      eta--;
      const etaElement = document.getElementById('ambulanceETA');
      if (etaElement && eta > 0) {
        etaElement.textContent = eta + ' min';
      } else if (etaElement) {
        etaElement.textContent = 'Arriving';
        clearInterval(countdown);
      }
    }, 10000); // Every 10 seconds for demo
  }

  closeEmergencyModal() {
    document.getElementById('emergencyActiveModal').classList.add('hidden');
    this.state.isEmergencyActive = false;
  }

  // Voice Recognition Functions
  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.state.speechRecognition = new SpeechRecognition();
      
      this.state.speechRecognition.continuous = false;
      this.state.speechRecognition.interimResults = false;
      this.state.speechRecognition.lang = 'en-US';

      this.state.speechRecognition.onstart = () => {
        this.state.isVoiceListening = true;
        this.showVoiceModal();
        this.updateVoiceStatus('Listening for "emergency1234"...');
      };

      this.state.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().replace(/\s+/g, '');
        
        // CRITICAL: Only accept "emergency1234"
        if (transcript.includes('emergency1234') || 
            transcript.includes('emergencyonetwothreefour')) {
          
          this.updateVoiceStatus('Code verified! Activating emergency...');
          
          setTimeout(() => {
            this.closeVoiceModal();
            this.showNotification('Emergency activated! Help is on the way.', 'success');
            this.showEmergencyModal();
          }, 1500);
        } else {
          this.updateVoiceStatus('Invalid code. Authorization failed.');
          this.showNotification('Incorrect code. Authorization failed.', 'error');
          
          setTimeout(() => {
            this.closeVoiceModal();
          }, 2000);
        }
      };

      this.state.speechRecognition.onend = () => {
        this.state.isVoiceListening = false;
      };

      this.state.speechRecognition.onerror = (event) => {
        this.showNotification('Voice recognition error. Please try again.', 'error');
        this.closeVoiceModal();
      };
    }
  }

  startVoiceRecognition() {
    if (!this.state.speechRecognition) {
      this.showNotification('Voice recognition not supported in this browser', 'error');
      return;
    }

    if (this.state.isVoiceListening) {
      this.state.speechRecognition.stop();
    } else {
      this.state.speechRecognition.start();
    }
  }

  showVoiceModal() {
    document.getElementById('voiceModal').classList.remove('hidden');
  }

  closeVoiceModal() {
    document.getElementById('voiceModal').classList.add('hidden');
    this.state.isVoiceListening = false;
  }

  updateVoiceStatus(message) {
    const statusElement = document.getElementById('voiceStatus');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  stopVoiceRecognition() {
    if (this.state.speechRecognition && this.state.isVoiceListening) {
      this.state.speechRecognition.stop();
    }
    this.closeVoiceModal();
  }

  // Utility Functions
  updateLocation() {
    this.showNotification('Location updated successfully', 'success');
  }

  editMedicalProfile() {
    this.showNotification('Medical profile editing would open here', 'info');
  }

  callService(phone, serviceName) {
    this.showNotification(`Calling ${serviceName}...`, 'info');
    
    // Simulate call connection
    setTimeout(() => {
      this.showNotification('Call connected', 'success');
    }, 2000);
  }

  // Chatbot Functions
  toggleChatbot() {
    this.state.chatbotOpen = !this.state.chatbotOpen;
    const chatWindow = document.getElementById('chatWindow');
    
    if (this.state.chatbotOpen) {
      chatWindow.classList.remove('hidden');
      setTimeout(() => chatWindow.classList.add('show'), 10);
    } else {
      chatWindow.classList.remove('show');
      setTimeout(() => chatWindow.classList.add('hidden'), 300);
    }
  }

  closeChatbot() {
    this.state.chatbotOpen = false;
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.remove('show');
    setTimeout(() => chatWindow.classList.add('hidden'), 300);
  }

  sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
      this.addChatMessage(message, 'user');
      input.value = '';
      
      // Generate Lexora response
      setTimeout(() => {
        const response = this.generateLexoraResponse(message);
        this.addChatMessage(response, 'lexora');
      }, 1000);
    }
  }

  addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const bubbleClass = sender === 'user' ? 'user-bubble' : 'lexora-bubble';
    
    messageDiv.innerHTML = `
      <div class="message-bubble ${bubbleClass}">${message}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  generateLexoraResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sos') || lowerMessage.includes('emergency') || lowerMessage.includes('how to use sos')) {
      return this.lexoraResponses.sos;
    } else if (lowerMessage.includes('medical') || lowerMessage.includes('profile') || lowerMessage.includes('update medical info')) {
      return this.lexoraResponses.medical;
    } else if (lowerMessage.includes('voice') || lowerMessage.includes('code') || lowerMessage.includes('voice code help')) {
      return this.lexoraResponses.voice;
    } else if (lowerMessage.includes('service') || lowerMessage.includes('hospital') || lowerMessage.includes('ambulance') || lowerMessage.includes('emergency services')) {
      return this.lexoraResponses.services;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return this.lexoraResponses.help;
    } else {
      return this.lexoraResponses.greeting;
    }
  }

  activateVoiceInput() {
    this.showNotification('Voice input activated - speak now', 'info');
    
    // Simulate voice recognition for chat
    setTimeout(() => {
      const simulatedInput = "How do I activate SOS?";
      document.getElementById('chatInput').value = simulatedInput;
      this.showNotification('Voice recognized', 'success');
    }, 2000);
  }

  // Notification System
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '10px',
      color: 'white',
      fontWeight: '600',
      zIndex: '3000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      maxWidth: '350px',
      fontSize: '0.9rem',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    });
    
    // Set background based on type
    switch(type) {
      case 'success':
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        break;
      case 'error':
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        break;
      case 'info':
      default:
        notification.style.background = 'linear-gradient(135deg, var(--deep-crimson) 0%, #a00000 100%)';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
}

// Global functions for onclick handlers
function sendQuickMessage(message) {
  app.addChatMessage(message, 'user');
  setTimeout(() => {
    const response = app.generateLexoraResponse(message);
    app.addChatMessage(response, 'lexora');
  }, 1000);
}

function closeEmergencyModal() {
  app.closeEmergencyModal();
}

function stopVoiceRecognition() {
  app.stopVoiceRecognition();
}

function closeVoiceModal() {
  app.closeVoiceModal();
}

// Initialize the application
const app = new ElysianApp();

// Make app globally available for debugging
window.app = app;