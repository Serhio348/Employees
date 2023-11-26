import React from 'react'
import { Layout as AntLayout } from 'antd'

import styles from "./Layout.module.css"

type Props = {
    children: React.ReactNode
}

const Layout = ({ children }: Props) => {
    return (
        <div className={styles.main}>
            <AntLayout.Content style={{ height: '100%' }}>
                {children}
            </AntLayout.Content>
        </div>
    )
}

export default Layout