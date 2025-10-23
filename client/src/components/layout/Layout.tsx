import React from 'react'
import { Layout as AntLayout } from 'antd'

import styles from "./Layout.module.css"
import Header from '../header/Header'
import { useHeader } from '../../contexts/HeaderContext'

type Props = {
    children: React.ReactNode
}

const Layout = ({ children }: Props) => {
    const { isHeaderHidden } = useHeader();
    
    return (
        <div className={styles.main}>
            {!isHeaderHidden && <Header />}
            <AntLayout.Content style={{ height: '100%' }}>
                {children}
            </AntLayout.Content>
        </div>
    )
}

export default Layout