import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { useCombinedStore } from '../store';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Github, Chrome, Twitter, ChevronDown, ChevronRight, Key, Bot, Shield, Zap, Clock, RefreshCw, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const OAuthManagementPage = () => {
  const { translations } = useLanguage()
  const [isGitHubConnected, setIsGitHubConnected] = useState(false)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isTwitterConnected, setIsTwitterConnected] = useState(false)
  const [isQwenConnected, setIsQwenConnected] = useState(false)
  const [qwenTokenStatus, setQwenTokenStatus] = useState<{ 
    isValid: boolean; 
    lastChecked: string | null; 
    nextCheck: string | null;
    requestsRemaining: number | null;
    errorMessage?: string;
  }>({
    isValid: false,
    lastChecked: null,
    nextCheck: null,
    requestsRemaining: null
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const addDebugLog = useCombinedStore((state) => state.addDebugLog)
  const debugLogs = useCombinedStore((state) => state.debugLog)
  const setAuthToken = useCombinedStore((state) => state.setAuthToken);
  const setTokenStatus = useCombinedStore((state) => state.setTokenStatus);
  const setCurrentPage = useCombinedStore((state) => state.setCurrentPage);
  const [bearerToken, setBearerToken] = useState('');

  const handleSaveToken = () => {
    if (bearerToken.trim()) {
      localStorage.setItem('authToken', bearerToken.trim());
      setAuthToken(bearerToken.trim());
      setTokenStatus(true);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Bearer token saved successfully - Redirecting to chat`);
      
      // Redirection vers la page de chat après une courte pause
      setTimeout(() => {
        setCurrentPage('chat');
      }, 500);
    }
  };

  // Provider-specific configurations with gothic theme colors
  const PROVIDER_CONFIG = {
    github: {
      name: translations.githubIntegration,
      icon: Github,
      connectedColor: 'bg-gray-800/50 border-green-700/50',
      disconnectedColor: 'bg-gray-800/30 border-gray-700/50',
      buttonConnect: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
      buttonDisconnect: 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border border-red-700/50'
    },
    google: {
      name: translations.googleIntegration,
      icon: Chrome,
      connectedColor: 'bg-gray-800/50 border-green-700/50',
      disconnectedColor: 'bg-gray-800/30 border-gray-700/50',
      buttonConnect: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
      buttonDisconnect: 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border border-red-700/50'
    },
    twitter: {
      name: translations.twitterIntegration,
      icon: Twitter,
      connectedColor: 'bg-gray-800/50 border-green-700/50',
      disconnectedColor: 'bg-gray-800/30 border-gray-700/50',
      buttonConnect: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
      buttonDisconnect: 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border border-red-700/50'
    },
    qwen: {
      name: 'Qwen.AI Chat 2000',
      icon: Bot,
      connectedColor: 'bg-purple-900/30 border-purple-700/50',
      disconnectedColor: 'bg-purple-900/20 border-purple-800/30',
      buttonConnect: 'bg-purple-700 hover:bg-purple-600 text-white border border-purple-600',
      buttonDisconnect: 'bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 border border-purple-700/50'
    }
  };

  // Check OAuth status on component mount
  useEffect(() => {
    const checkOAuthStatus = async () => {
      try {
        // Check for OAuth tokens in cookies
        const cookies = document.cookie.split(';')
        
        const hasGitHubToken = cookies.some(cookie => 
          cookie.trim().startsWith('agenticforge_jwt=') && 
          cookie.trim().length > 'agenticforge_jwt='.length
        )
        
        const hasGoogleToken = cookies.some(cookie => 
          cookie.trim().startsWith('agenticforge_google_token=') && 
          cookie.trim().length > 'agenticforge_google_token='.length
        )
        
        const hasTwitterToken = cookies.some(cookie => 
          cookie.trim().startsWith('agenticforge_twitter_token=') && 
          cookie.trim().length > 'agenticforge_twitter_token='.length
        )

        // Check Qwen connection status via API
        let hasQwenToken = false;
        try {
          const response = await fetch('/api/auth/qwen/status');
          if (response.ok) {
            const data = await response.json();
            hasQwenToken = data.connected;
          }
        } catch (error) {
          console.error('Error checking Qwen connection status:', error);
        }
        
        // Log the OAuth status check
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Checking OAuth status - GitHub: ${hasGitHubToken}, Google: ${hasGoogleToken}, Twitter: ${isTwitterConnected}, Qwen: ${hasQwenToken}`);
        
        // Extract and log the bearer token if present
        const authHeader = localStorage.getItem('authToken');
        if (authHeader) {
          addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Backend Bearer Token found in localStorage: ${authHeader.substring(0, 20)}...`);
        } else {
          // Check for token in cookies as fallback
          const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));
          if (tokenCookie) {
            const token = tokenCookie.split('=')[1];
            addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Backend Bearer Token found in cookies: ${token.substring(0, 20)}...`);
          } else {
            addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] No backend Bearer Token found`);
          }
        }
        
        setIsGitHubConnected(hasGitHubToken)
        setIsGoogleConnected(hasGoogleToken)
        setIsTwitterConnected(hasTwitterToken)
        setIsQwenConnected(hasQwenToken)
        setIsCheckingStatus(false)
      } catch (error) {
        console.error('Error checking OAuth status:', error)
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error checking OAuth status: ${error instanceof Error ? error.message : String(error)}`)
        setIsCheckingStatus(false)
      }
    };

    checkOAuthStatus()
  }, [addDebugLog, isTwitterConnected])

  // Check Qwen token status periodically
  useEffect(() => {
    const checkQwenTokenStatus = async () => {
      if (!isQwenConnected) return;
      
      try {
        const response = await fetch('/api/llm-keys/qwen/status');
        if (response.ok) {
          const data = await response.json();
          setQwenTokenStatus({
            isValid: data.isValid,
            lastChecked: new Date().toLocaleTimeString(),
            nextCheck: new Date(Date.now() + 300000).toLocaleTimeString(), // 5 minutes
            requestsRemaining: data.requestsRemaining,
            errorMessage: data.errorMessage
          });
        }
      } catch (error) {
        console.error('Error checking Qwen token status:', error);
        setQwenTokenStatus(prev => ({
          ...prev,
          errorMessage: 'Failed to check token status'
        }));
      }
    };

    // Check immediately and then every 5 minutes
    checkQwenTokenStatus();
    const interval = setInterval(checkQwenTokenStatus, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isQwenConnected]);

  const handleGitHubLogin = () => {
    try {
      // Log the attempt to initiate GitHub OAuth
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Initiating GitHub OAuth flow`);
      
      // Redirect to GitHub OAuth endpoint
      window.location.href = '/auth/github';
    } catch (error) {
      console.error('Error initiating GitHub OAuth:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error initiating GitHub OAuth: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGoogleLogin = () => {
    try {
      // Log the attempt to initiate Google OAuth
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Initiating Google OAuth flow`);
      
      // Redirect to Google OAuth endpoint
      window.location.href = '/auth/google';
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error initiating Google OAuth: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleTwitterLogin = () => {
    try {
      // Log the attempt to initiate Twitter OAuth
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Initiating Twitter OAuth flow`);
      
      // Redirect to Twitter OAuth endpoint
      window.location.href = '/auth/twitter';
    } catch (error) {
      console.error('Error initiating Twitter OAuth:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error initiating Twitter OAuth: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGitHubLogout = () => {
    try {
      // Clear GitHub OAuth token from cookies
      document.cookie = 'agenticforge_jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Update state
      setIsGitHubConnected(false)
      
      // Add debug log
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] GitHub OAuth token removed.`)
    } catch (error) {
      console.error('Error removing GitHub OAuth token:', error)
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error removing GitHub OAuth token: ${error instanceof Error ? error.message : String(error)}`)
    }
  };

  const handleGoogleLogout = () => {
    try {
      // Clear Google OAuth token from cookies
      document.cookie = 'agenticforge_google_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Update state
      setIsGoogleConnected(false)
      
      // Add debug log
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Google OAuth token removed.`)
    } catch (error) {
      console.error('Error removing Google OAuth token:', error)
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error removing Google OAuth token: ${error instanceof Error ? error.message : String(error)}`)
    }
  };

  const handleTwitterLogout = () => {
    try {
      // Clear Twitter OAuth token from cookies
      document.cookie = 'agenticforge_twitter_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Update state
      setIsTwitterConnected(false)
      
      // Add debug log
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Twitter OAuth token removed.`)
    } catch (error) {
      console.error('Error removing Twitter OAuth token:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error removing Twitter OAuth token: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleQwenLogin = async () => {
    try {
      // Log the attempt to check Qwen credentials
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Checking Qwen.AI Chat 2000 credentials`);
      
      // Try to read Qwen credentials from .qwen directory
      try {
        const response = await fetch('/api/auth/qwen/credentials', {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.accessToken) {
            // Display the access token in debug logs
            addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Qwen.AI Chat 2000 Access Token found: ${data.accessToken.substring(0, 20)}...`);
            
            // Update state to show connected
            setIsQwenConnected(true);
            
            // Show the access token in an alert with copy functionality
            const token = data.accessToken;
            const tokenDisplay = `${token.substring(0, 30)}...${token.substring(token.length - 10)}`;
            
            // Create a temporary input element to copy the token
            const tempInput = document.createElement('input');
            tempInput.value = token;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            // Show alert with token information
            alert(`Qwen.AI Chat 2000 Access Token found and copied to clipboard!

Token: ${tokenDisplay}

The full token has been copied to your clipboard.`);
          } else {
            // No credentials found, redirect to OAuth flow
            addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] No Qwen.AI Chat 2000 credentials found, initiating OAuth flow`);
            window.location.href = '/api/auth/qwen';
          }
        } else {
          // API error, fallback to OAuth flow
          addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] API error checking credentials, initiating OAuth flow`);
          window.location.href = '/api/auth/qwen';
        }
      } catch (error) {
        // Error reading credentials, fallback to OAuth flow
        console.error('Error checking Qwen credentials:', error);
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error checking Qwen credentials: ${error instanceof Error ? error.message : String(error)}, initiating OAuth flow`);
        window.location.href = '/api/auth/qwen';
      }
    } catch (error) {
      console.error('Error checking Qwen.AI Chat 2000 credentials:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error checking Qwen.AI Chat 2000 credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleQwenLogout = async () => {
    try {
      // Clear Qwen OAuth token from Redis via API
      const response = await fetch('/api/auth/qwen/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update state
        setIsQwenConnected(false);
        
        // Add debug log
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Qwen.AI Chat 2000 OAuth token removed.`);
      } else {
        throw new Error('Failed to logout from Qwen');
      }
    } catch (error) {
      console.error('Error removing Qwen.AI Chat 2000 OAuth token:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error removing Qwen.AI Chat 2000 OAuth token: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <motion.div 
      className="container mx-auto py-8 bg-gray-900 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="max-w-2xl mx-auto shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700">
          <CardHeader className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 text-white rounded-t-lg border-b border-gray-700">
            <CardTitle className="text-2xl flex items-center">
              <Shield className="mr-3 h-6 w-6 text-purple-400" />
              {translations.oauthManagement}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {translations.oauthManagementDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center text-white">
                <Key className="mr-2 h-5 w-5 text-purple-400" />
                {translations.authToken}
              </h3>
              <p className="text-sm text-gray-400">
                To use the agent, you need to provide a valid authentication token. 
                This token is used to authenticate your requests to the backend API.
              </p>
              <div className="space-y-2">
                <Label htmlFor="bearerToken" className="text-gray-300">Bearer Token</Label>
                <Input
                  id="bearerToken"
                  name="bearerToken"
                  type="password"
                  placeholder={translations.authTokenPlaceholder}
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500
                    focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50"
                />
              </div>
              <Button 
                onClick={handleSaveToken}
                className="w-full bg-purple-700 hover:bg-purple-600 text-white
                  disabled:bg-gray-700 disabled:text-gray-500 border border-purple-600"
                disabled={!bearerToken.trim()}
              >
                {translations.saveToken}
              </Button>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Alert variant="default" className="border-2 border-blue-700/50 bg-blue-900/20 backdrop-blur-sm">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
                <AlertTitle className="font-bold text-blue-300">Authentication Setup</AlertTitle>
                <AlertDescription className="text-blue-400/80">
                  <p className="mb-2">
                    To use the agent, you need to authenticate with one of the supported providers below.
                    After connecting, your authentication token will be automatically set up for use with the agent.
                  </p>
                  <p>
                    If you prefer to use a manual token, you can set it up in the LLM API Key Management section.
                  </p>
                </AlertDescription>
              </Alert>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Alert variant="default" className="border-2 border-amber-700/50 bg-amber-900/20 backdrop-blur-sm">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <AlertTitle className="font-bold text-amber-300">{translations.securityWarning}</AlertTitle>
                <AlertDescription className="text-amber-400/80">
                  {translations.oauthSecurityWarning}
                </AlertDescription>
              </Alert>
            </motion.div>
            
            <div className="space-y-6">
              {/* GitHub Integration */}
              <motion.div 
                className="space-y-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Github className="mr-2 h-5 w-5 text-gray-400" />
                  {PROVIDER_CONFIG.github.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-400">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 backdrop-blur-sm ${
                      isGitHubConnected 
                        ? PROVIDER_CONFIG.github.connectedColor 
                        : PROVIDER_CONFIG.github.disconnectedColor
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div>
                      <p className="font-medium text-white">{translations.githubConnectionStatus}</p>
                      <p className="text-sm text-gray-400">
                        {isGitHubConnected 
                          ? translations.githubConnected 
                          : translations.githubNotConnected}
                      </p>
                    </div>
                    <div>
                      {isGitHubConnected ? (
                        <Button 
                          variant="destructive" 
                          onClick={handleGitHubLogout}
                          className={PROVIDER_CONFIG.github.buttonDisconnect}
                        >
                          {translations.disconnect}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleGitHubLogin}
                          className={PROVIDER_CONFIG.github.buttonConnect}
                        >
                          {translations.connectGitHub}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Google Integration */}
              <motion.div 
                className="space-y-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Chrome className="mr-2 h-5 w-5 text-blue-400" />
                  {PROVIDER_CONFIG.google.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-400">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 backdrop-blur-sm ${
                      isGoogleConnected 
                        ? PROVIDER_CONFIG.google.connectedColor 
                        : PROVIDER_CONFIG.google.disconnectedColor
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div>
                      <p className="font-medium text-white">{translations.googleConnectionStatus}</p>
                      <p className="text-sm text-gray-400">
                        {isGoogleConnected 
                          ? translations.googleConnected 
                          : translations.googleNotConnected}
                      </p>
                    </div>
                    <div>
                      {isGoogleConnected ? (
                        <Button 
                          variant="destructive" 
                          onClick={handleGoogleLogout}
                          className={PROVIDER_CONFIG.google.buttonDisconnect}
                        >
                          {translations.disconnect}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleGoogleLogin}
                          className={PROVIDER_CONFIG.google.buttonConnect}
                        >
                          {translations.connectGoogle}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Twitter Integration */}
              <motion.div 
                className="space-y-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Twitter className="mr-2 h-5 w-5 text-sky-400" />
                  {PROVIDER_CONFIG.twitter.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-400">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 backdrop-blur-sm ${
                      isTwitterConnected 
                        ? PROVIDER_CONFIG.twitter.connectedColor 
                        : PROVIDER_CONFIG.twitter.disconnectedColor
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div>
                      <p className="font-medium text-white">{translations.twitterConnectionStatus}</p>
                      <p className="text-sm text-gray-400">
                        {isTwitterConnected 
                          ? translations.twitterConnected 
                          : translations.twitterNotConnected}
                      </p>
                    </div>
                    <div>
                      {isTwitterConnected ? (
                        <Button 
                          variant="destructive" 
                          onClick={handleTwitterLogout}
                          className={PROVIDER_CONFIG.twitter.buttonDisconnect}
                        >
                          {translations.disconnect}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleTwitterLogin}
                          className={PROVIDER_CONFIG.twitter.buttonConnect}
                        >
                          {translations.connectTwitter}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Qwen.AI Chat 2000 Integration */}
              <motion.div 
                className="space-y-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Bot className="mr-2 h-5 w-5 text-purple-400" />
                  {PROVIDER_CONFIG.qwen.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-400">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex flex-col p-4 border rounded-lg transition-all duration-300 backdrop-blur-sm ${
                      isQwenConnected 
                        ? PROVIDER_CONFIG.qwen.connectedColor 
                        : PROVIDER_CONFIG.qwen.disconnectedColor
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Qwen.AI Chat 2000 Status</p>
                        <p className="text-sm text-gray-400">
                          {isQwenConnected 
                            ? 'Qwen.AI Chat 2000 ready - 2000 free requests/day' 
                            : 'Check for local credentials or connect to Qwen.AI'}
                        </p>
                        <p className="text-xs text-purple-400/80 mt-1">
                          Advanced AI interface with Qwen models - 2000 free requests per day
                        </p>
                        {isQwenConnected && (
                          <p className="text-xs text-green-400/90 mt-1">
                            ✓ Access token found and copied to clipboard
                          </p>
                        )}
                      </div>
                      <div>
                        {isQwenConnected ? (
                          <Button 
                            variant="destructive" 
                            onClick={handleQwenLogout}
                            className={PROVIDER_CONFIG.qwen.buttonDisconnect}
                          >
                            {translations.disconnect}
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleQwenLogin}
                            className={PROVIDER_CONFIG.qwen.buttonConnect}
                          >
                            Check & Copy Token
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Qwen Token Monitoring */}
                    {isQwenConnected && (
                      <div className="mt-4 pt-4 border-t border-purple-800/50">
                        <Alert variant="default" className="mb-4 border-2 border-amber-700/50 bg-amber-900/20 backdrop-blur-sm">
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                          <AlertTitle className="font-bold text-amber-300">Note importante</AlertTitle>
                          <AlertDescription className="text-amber-400/80">
                            Pour maintenir la validité de la clé, ne rouvrez jamais l'interface CLI de Qwen après l'avoir obtenue.
                          </AlertDescription>
                        </Alert>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-purple-300 flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Token Monitoring
                          </h4>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              // Trigger manual refresh
                              const checkQwenTokenStatus = async () => {
                                try {
                                  const response = await fetch('/api/llm-keys/qwen/status');
                                  if (response.ok) {
                                    const data = await response.json();
                                    setQwenTokenStatus({
                                      isValid: data.isValid,
                                      lastChecked: new Date().toLocaleTimeString(),
                                      nextCheck: new Date(Date.now() + 300000).toLocaleTimeString(), // 5 minutes
                                      requestsRemaining: data.requestsRemaining,
                                      errorMessage: data.errorMessage
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error checking Qwen token status:', error);
                                  setQwenTokenStatus(prev => ({
                                    ...prev,
                                    errorMessage: 'Failed to check token status'
                                  }));
                                }
                              };
                              checkQwenTokenStatus();
                            }}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/50"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div className="flex items-center">
                            <Clock className="mr-2 h-3 w-3 text-purple-400" />
                            <span className="text-gray-400">Last checked:</span>
                            <span className="ml-1 text-purple-300">
                              {qwenTokenStatus.lastChecked || 'Never'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-3 w-3 text-purple-400" />
                            <span className="text-gray-400">Next check:</span>
                            <span className="ml-1 text-purple-300">
                              {qwenTokenStatus.nextCheck || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Zap className="mr-2 h-3 w-3 text-purple-400" />
                            <span className="text-gray-400">Requests left:</span>
                            <span className="ml-1 text-purple-300">
                              {qwenTokenStatus.requestsRemaining !== null 
                                ? qwenTokenStatus.requestsRemaining 
                                : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Shield className="mr-2 h-3 w-3 text-purple-400" />
                            <span className="text-gray-400">Status:</span>
                            <span className={`ml-1 ${qwenTokenStatus.isValid ? 'text-green-400' : 'text-red-400'}`}>
                              {qwenTokenStatus.isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </div>
                        </div>
                        
                        {qwenTokenStatus.errorMessage && (
                          <div className="mt-2 p-2 bg-red-900/30 rounded border border-red-700/50 text-xs text-red-300">
                            Error: {qwenTokenStatus.errorMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
            
            <motion.div 
              className="text-sm p-4 bg-gray-800/50 rounded-lg border border-gray-700 backdrop-blur-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <h4 className="font-bold text-white mb-2 flex items-center">
                <Zap className="mr-2 h-4 w-4 text-amber-400" />
                {translations.oauthExplanationTitle}
              </h4>
              <p className="text-gray-400">{translations.oauthExplanation}</p>
            </motion.div>
            
            {/* Collapsible Debug History Section */}
            <motion.div 
              className="border border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <button
                className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-700/50 rounded-t-lg"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <h4 className="font-bold text-white">Debug History</h4>
                {isHistoryOpen ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {isHistoryOpen && (
                <div className="p-4 bg-gray-900/30 max-h-60 overflow-y-auto border-t border-gray-700">
                  {debugLogs.length > 0 ? (
                    <ul className="space-y-2">
                      {debugLogs.map((log: string, index: number) => (
                        <li key={index} className="text-xs font-mono text-gray-400 p-2 bg-gray-900/50 rounded border border-gray-700">
                          {log}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No debug logs yet.</p>
                  )}
                </div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}