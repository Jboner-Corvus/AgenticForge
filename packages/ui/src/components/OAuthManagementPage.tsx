import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { useStore } from '../lib/store';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Github, Chrome, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';

export const OAuthManagementPage = () => {
  const { translations } = useLanguage()
  const [isGitHubConnected, setIsGitHubConnected] = useState(false)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isTwitterConnected, setIsTwitterConnected] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const addDebugLog = useStore((state) => state.addDebugLog)

  // Provider-specific configurations
  const PROVIDER_CONFIG = {
    github: {
      name: translations.githubIntegration,
      icon: Github,
      connectedColor: 'bg-green-100 border-green-500',
      disconnectedColor: 'bg-red-100 border-red-500',
      buttonConnect: 'bg-black hover:bg-gray-800 text-white',
      buttonDisconnect: 'bg-red-500 hover:bg-red-600 text-white'
    },
    google: {
      name: translations.googleIntegration,
      icon: Chrome,
      connectedColor: 'bg-blue-100 border-blue-500',
      disconnectedColor: 'bg-red-100 border-red-500',
      buttonConnect: 'bg-blue-500 hover:bg-blue-600 text-white',
      buttonDisconnect: 'bg-red-500 hover:bg-red-600 text-white'
    },
    twitter: {
      name: translations.twitterIntegration,
      icon: Twitter,
      connectedColor: 'bg-sky-100 border-sky-500',
      disconnectedColor: 'bg-red-100 border-red-500',
      buttonConnect: 'bg-sky-500 hover:bg-sky-600 text-white',
      buttonDisconnect: 'bg-red-500 hover:bg-red-600 text-white'
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
        
        setIsGitHubConnected(hasGitHubToken)
        setIsGoogleConnected(hasGoogleToken)
        setIsTwitterConnected(hasTwitterToken)
        setIsCheckingStatus(false)
      } catch (error) {
        console.error('Error checking OAuth status:', error)
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error checking OAuth status: ${error instanceof Error ? error.message : String(error)}`)
        setIsCheckingStatus(false)
      }
    };

    checkOAuthStatus()
  }, [addDebugLog])

  const handleGitHubLogin = () => {
    try {
      // Redirect to GitHub OAuth endpoint
      window.location.href = '/auth/github';
    } catch (error) {
      console.error('Error initiating GitHub OAuth:', error)
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error initiating GitHub OAuth: ${error instanceof Error ? error.message : String(error)}`)
    }
  };

  const handleGoogleLogin = () => {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = '/auth/google';
    } catch (error) {
      console.error('Error initiating Google OAuth:', error)
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error initiating Google OAuth: ${error instanceof Error ? error.message : String(error)}`)
    }
  };

  const handleTwitterLogin = () => {
    try {
      // Redirect to Twitter OAuth endpoint
      window.location.href = '/auth/twitter';
    } catch (error) {
      console.error('Error initiating Twitter OAuth:', error)
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error initiating Twitter OAuth: ${error instanceof Error ? error.message : String(error)}`)
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
      console.error('Error removing Twitter OAuth token:', error)
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error removing Twitter OAuth token: ${error instanceof Error ? error.message : String(error)}`)
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
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">{translations.oauthManagement}</CardTitle>
            <CardDescription className="text-blue-100">
              {translations.oauthManagementDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Alert variant="destructive" className="border-2">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-bold">{translations.securityWarning}</AlertTitle>
                <AlertDescription>
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
                <h3 className="text-lg font-medium flex items-center">
                  <Github className="mr-2 h-5 w-5" />
                  {PROVIDER_CONFIG.github.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2">{translations.checkingStatus}</span>
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
                      <p className="font-medium">{translations.githubConnectionStatus}</p>
                      <p className="text-sm">
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
                <h3 className="text-lg font-medium flex items-center">
                  <Chrome className="mr-2 h-5 w-5" />
                  {PROVIDER_CONFIG.google.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2">{translations.checkingStatus}</span>
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
                      <p className="font-medium">{translations.googleConnectionStatus}</p>
                      <p className="text-sm">
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
                <h3 className="text-lg font-medium flex items-center">
                  <Twitter className="mr-2 h-5 w-5" />
                  {PROVIDER_CONFIG.twitter.name}
                </h3>
                
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2">{translations.checkingStatus}</span>
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
                      <p className="font-medium">{translations.twitterConnectionStatus}</p>
                      <p className="text-sm">
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
            </div>
            
            <motion.div 
              className="text-sm text-muted-foreground p-4 bg-gray-50 rounded-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <p>{translations.oauthExplanation}</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
