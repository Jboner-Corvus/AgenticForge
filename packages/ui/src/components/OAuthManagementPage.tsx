import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { useStore } from '../lib/store';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Github, Chrome, Twitter, ChevronDown, ChevronRight, Key, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const OAuthManagementPage = () => {
  const { translations } = useLanguage()
  const [isGitHubConnected, setIsGitHubConnected] = useState(false)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isTwitterConnected, setIsTwitterConnected] = useState(false)
  const [isQwenConnected, setIsQwenConnected] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const addDebugLog = useStore((state) => state.addDebugLog)
  const debugLogs = useStore((state) => state.debugLog)
  const setAuthToken = useStore((state) => state.setAuthToken);
  const setTokenStatus = useStore((state) => state.setTokenStatus);
  const setCurrentPage = useStore((state) => state.setCurrentPage);
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

  // Provider-specific configurations with uniform colors
  const PROVIDER_CONFIG = {
    github: {
      name: translations.githubIntegration,
      icon: Github,
      connectedColor: 'bg-gray-100 border-gray-300',
      disconnectedColor: 'bg-gray-50 border-gray-200',
      buttonConnect: 'bg-gray-800 hover:bg-gray-700 text-white',
      buttonDisconnect: 'bg-gray-500 hover:bg-gray-600 text-white'
    },
    google: {
      name: translations.googleIntegration,
      icon: Chrome,
      connectedColor: 'bg-gray-100 border-gray-300',
      disconnectedColor: 'bg-gray-50 border-gray-200',
      buttonConnect: 'bg-gray-800 hover:bg-gray-700 text-white',
      buttonDisconnect: 'bg-gray-500 hover:bg-gray-600 text-white'
    },
    twitter: {
      name: translations.twitterIntegration,
      icon: Twitter,
      connectedColor: 'bg-gray-100 border-gray-300',
      disconnectedColor: 'bg-gray-50 border-gray-200',
      buttonConnect: 'bg-gray-800 hover:bg-gray-700 text-white',
      buttonDisconnect: 'bg-gray-500 hover:bg-gray-600 text-white'
    },
    qwen: {
      name: 'Qwen.AI Chat',
      icon: Bot,
      connectedColor: 'bg-purple-100 border-purple-300',
      disconnectedColor: 'bg-purple-50 border-purple-200',
      buttonConnect: 'bg-purple-600 hover:bg-purple-700 text-white',
      buttonDisconnect: 'bg-purple-500 hover:bg-purple-600 text-white'
    }
  };

  // Check OAuth status on component mount
  useEffect(() => {
    const checkOAuthStatus = () => {
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

        const hasQwenToken = cookies.some(cookie => 
          cookie.trim().startsWith('agenticforge_qwen_token=') && 
          cookie.trim().length > 'agenticforge_qwen_token='.length
        )
        
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

  const handleQwenLogin = () => {
    try {
      // Log the attempt to initiate Qwen OAuth
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Opening Qwen.AI Chat in new tab`);
      
      // Open Qwen.AI in a new tab
      window.open('https://chat.qwen.ai/', '_blank');
      
      // Mark as connected for demo purposes
      setIsQwenConnected(true);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Qwen.AI Chat opened successfully`);
    } catch (error) {
      console.error('Error opening Qwen.AI Chat:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error opening Qwen.AI Chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleQwenLogout = () => {
    try {
      // Clear Qwen OAuth token from cookies (if implemented)
      document.cookie = 'agenticforge_qwen_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Update state
      setIsQwenConnected(false)
      
      // Add debug log
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Qwen.AI OAuth token removed.`)
    } catch (error) {
      console.error('Error removing Qwen.AI OAuth token:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error removing Qwen.AI OAuth token: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <motion.div 
      className="container mx-auto py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader className="bg-gray-100 text-gray-800 rounded-t-lg">
            <CardTitle className="text-2xl">{translations.oauthManagement}</CardTitle>
            <CardDescription className="text-gray-600">
              {translations.oauthManagementDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Key className="mr-2 h-5 w-5" />
                {translations.authToken}
              </h3>
              <p className="text-sm text-gray-600">
                To use the agent, you need to provide a valid authentication token. 
                This token is used to authenticate your requests to the backend API.
              </p>
              <div className="space-y-2">
                <Label htmlFor="bearerToken">{translations.authToken}</Label>
                <Input
                  id="bearerToken"
                  name="bearerToken"
                  type="password"
                  placeholder={translations.authTokenPlaceholder}
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSaveToken}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
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
              <Alert variant="default" className="border-2 border-blue-500 bg-blue-50">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <AlertTitle className="font-bold text-blue-800">Authentication Setup</AlertTitle>
                <AlertDescription className="text-blue-700">
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
              <Alert variant="default" className="border-2 border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="font-bold text-yellow-800">{translations.securityWarning}</AlertTitle>
                <AlertDescription className="text-yellow-700">
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
                <h3 className="text-lg font-medium flex items-center text-foreground">
                  <Github className="mr-2 h-5 w-5" />
                  {PROVIDER_CONFIG.github.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-600">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      isGitHubConnected 
                        ? PROVIDER_CONFIG.github.connectedColor 
                        : PROVIDER_CONFIG.github.disconnectedColor
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{translations.githubConnectionStatus}</p>
                      <p className="text-sm text-gray-600">
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
                <h3 className="text-lg font-medium flex items-center text-foreground">
                  <Chrome className="mr-2 h-5 w-5" />
                  {PROVIDER_CONFIG.google.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-600">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      isGoogleConnected 
                        ? PROVIDER_CONFIG.google.connectedColor 
                        : PROVIDER_CONFIG.google.disconnectedColor
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{translations.googleConnectionStatus}</p>
                      <p className="text-sm text-gray-600">
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
                <h3 className="text-lg font-medium flex items-center text-foreground">
                  <Twitter className="mr-2 h-5 w-5" />
                  {PROVIDER_CONFIG.twitter.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-600">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      isTwitterConnected 
                        ? PROVIDER_CONFIG.twitter.connectedColor 
                        : PROVIDER_CONFIG.twitter.disconnectedColor
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{translations.twitterConnectionStatus}</p>
                      <p className="text-sm text-gray-600">
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

              {/* Qwen.AI Integration */}
              <motion.div 
                className="space-y-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <h3 className="text-lg font-medium flex items-center text-foreground">
                  <Bot className="mr-2 h-5 w-5" />
                  {PROVIDER_CONFIG.qwen.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-600">{translations.checkingStatus}</span>
                  </div>
                ) : (
                  <motion.div 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      isQwenConnected 
                        ? PROVIDER_CONFIG.qwen.connectedColor 
                        : PROVIDER_CONFIG.qwen.disconnectedColor
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">Qwen.AI Chat Status</p>
                      <p className="text-sm text-gray-600">
                        {isQwenConnected 
                          ? 'Qwen.AI Chat ouvert - Prêt à utiliser' 
                          : 'Accès direct à https://chat.qwen.ai/'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Interface IA avancée avec modèles Qwen dernière génération
                      </p>
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
                          Ouvrir Qwen.AI
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
            
            <motion.div 
              className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <p>{translations.oauthExplanation}</p>
            </motion.div>
            
            {/* Backend Bearer Token Display (for debugging) */}
            <motion.div 
              className="text-sm p-4 bg-gray-50 rounded-lg border border-gray-200"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <h4 className="font-medium text-gray-800 mb-2">Backend Bearer Token (Debug Info)</h4>
              <div className="font-mono text-xs break-all text-gray-600">
                {(() => {
                  const token = localStorage.getItem('authToken') || 
                    document.cookie.split(';').find(c => c.trim().startsWith('authToken='))?.split('=')[1] ||
                    'Not found';
                  return token !== 'Not found' ? `${token.substring(0, 30)}...` : token;
                })()}
              </div>
              <p className="mt-2 text-gray-600">
                This token is used to authenticate with the backend API.
              </p>
            </motion.div>
            
            {/* Collapsible Debug History Section */}
            <motion.div 
              className="border border-gray-200 rounded-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <button
                className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <h4 className="font-medium text-gray-800">Debug History</h4>
                {isHistoryOpen ? (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                )}
              </button>
              
              {isHistoryOpen && (
                <div className="p-4 bg-white max-h-60 overflow-y-auto">
                  {debugLogs.length > 0 ? (
                    <ul className="space-y-2">
                      {debugLogs.map((log: string, index: number) => (
                        <li key={index} className="text-xs font-mono text-gray-600">
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
            
            {/* Manual Token Setup Instructions */}
            <motion.div 
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.3 }}
            >
              <h4 className="font-medium text-gray-800 mb-2">Manual Token Setup</h4>
              <p className="text-sm text-gray-600 mb-3">
                If you prefer to set up your authentication token manually:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Go to the LLM API Key Management page</li>
                <li>Add your bearer token in the appropriate field</li>
                <li>Save the configuration</li>
              </ol>
              <Button 
                className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-white"
                onClick={() => useStore.getState().setCurrentPage('llm-api-keys')}
              >
                Go to LLM API Key Management
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}