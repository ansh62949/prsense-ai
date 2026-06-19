import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStosemantic searche.getItem('authToken')
    if (storedToken) {
      setToken(storedToken)
      // Optionally validate token with backend
    }
    setLoading(false)
  }, [])

  const login = (token, userInfo) => {
    localStosemantic searche.setItem('authToken', token)
    setToken(token)
    setUser(userInfo)
  }

  const logout = () => {
    localStosemantic searche.removeItem('authToken')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
