import React, { useEffect } from 'react'
import { useCurrentQuery } from '../../app/services/auth'
import { useDispatch } from 'react-redux'
import { message } from 'antd'
import { clearAuth } from './authSlice'

const Auth = ({ children }: { children: JSX.Element }) => {
  const dispatch = useDispatch()
  const { isLoading } = useCurrentQuery()

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(clearAuth())
      message.warning('Сессия истекла. Войдите заново.')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [dispatch])

  if (isLoading) {
    return <span>Загрузка</span>
  }

  return (
    children
  )
}

export default Auth