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
import { observer } from 'mobx-react'

import { isEmpty, toLower } from 'lodash'

import PodStore from 'stores/pod'

import styles from './index.scss'

@observer
export default class Service extends Component {
  podStore = new PodStore()

  componentDidMount() {
    const { cluster, detail, workloadDetail } = this.props
    this.podStore.fetchList({
      cluster,
      namespace: detail.namespace,
      ownerKind: workloadDetail.kind === 'Deployment' ? 'ReplicaSet': workloadDetail.kind,
      limit: 1
    })
  }

  formatInternalAddr = (namespace, serviceName, portInfo) => {
    const protocol = this.resolveProtocol(portInfo)
    const host = `${serviceName}.${namespace}`
    const port = (portInfo.port===80 || portInfo.port===443) ? '' : `:${portInfo.port}`
    return `${protocol}://${host}${port}`
  }

  formatOuternalAddr = (portInfo) => {
    const pods = this.podStore.list.data
    const protocol = this.resolveProtocol(portInfo)
    const host = pods&&pods.length?pods[0].nodeIp:'<node-ip>'
    const port = (portInfo.nodePort===80 || portInfo.nodePort===443) ? '' : `:${portInfo.nodePort}`
    return `${protocol}://${host}${port}`
  }

  resolveProtocol = (portInfo) => {
    return (portInfo.name.indexOf('-') !== -1) ? toLower(portInfo.name.split('-')[0]) : 'http'
  }

  render() {
    const { detail, workloadDetail } = this.props

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
                <strong>{this.formatInternalAddr(detail.namespace, detail.name, port)}</strong>
              </p>
              <p>{t('内部地址')}</p>
            </div>
            {this.props.gateway && (
            <div className={styles.dns}>
              <p>
                <a target="_blank" href={this.props.gateway}>
                  <strong>{this.props.gateway}</strong>
                </a>
              </p>
              <p>{t('外部地址')}</p>
            </div>
            )}
            {!this.props.gateway && port.nodePort && (
            <div className={styles.dns}>
              <p>
                <a target="_blank" href={this.formatOuternalAddr(port)}>
                  <strong>{this.formatOuternalAddr(port)}</strong>
                </a>
              </p>
              <p>{t('外部地址')}</p>
            </div>
            )}
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
