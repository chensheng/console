/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react'
import { Icon } from '@kube-design/components'

import { isEmpty, toLower } from 'lodash'

import styles from './index.scss'

export default class Service extends Component {

  formatServiceAddr = (namespace, serviceName, portInfo) => {
    const protocol = (portInfo.name.indexOf('-') !== -1) ? toLower(portInfo.name.split('-')[0]) : 'http'
    const host = `${serviceName}.${namespace}`
    const port = (portInfo.port===80 || portInfo.port===443) ? '' : `:${portInfo.port}`
    return `${protocol}://${host}${port}`
  }

  render() {
    const { detail } = this.props

    if (isEmpty(detail.ports)) {
      return null
    }

    return (
      <div className={styles.portsWrapper}>
        {detail.ports.map((port, index) => (
          <div key={index} className={styles.ports}>
            <Icon name="dns" size={40} />
            <div className={styles.dns}>
              <p>
                <strong>{this.formatServiceAddr(detail.namespace, detail.name, port)}</strong>
              </p>
              <p>{t('集群内地址')}</p>
            </div>
            <Icon name="pod" size={40} />
            <div className={styles.port}>
              <p>
                <strong>{port.targetPort}</strong>
              </p>
              <p>{t('Container Port')}</p>
            </div>
            <div className={styles.protocol}>→ {port.protocol} → </div>
            <Icon name="network-router" size={40} />
            <div className={styles.port}>
              <p>
                <strong>{port.port}</strong>
              </p>
              <p>{t('Service Port')}</p>
            </div>
            {port.nodePort && (
              <>
                <div className={styles.protocol}>→ {port.protocol} → </div>
                <Icon name="nodes" size={40} />
                <div className={styles.port}>
                  <p>
                    <strong>{port.nodePort}</strong>
                  </p>
                  <div>
                    {t('Node Port')}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    )
  }
}
