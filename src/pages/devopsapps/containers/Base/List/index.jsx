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
import { inject, observer } from 'mobx-react'
import { Loading } from '@kube-design/components'

import { renderRoutes } from 'utils/router.config'
import { Nav } from 'components/Layout'
import Selector from 'projects/components/Selector'

import styles from './index.scss'

@inject('rootStore', 'devopsappStore')
@observer
class DevOpsAppListLayout extends Component {
  get store() {
    return this.props.devopsappStore
  }

  get workspace() {
    return this.props.match.params.workspace
  }

  get devopsapp() {
    return this.props.match.params.devopsapp
  }

  get routing() {
    return this.props.rootStore.routing
  }

  handleChange = url => this.routing.push(url)

  generateNavs = () => {
    // debugger
    const envItems = []
    if (this.store.data.spec) {
      const { environments } = this.store.data.spec
      environments &&
        environments.forEach(env => {
          envItems.push({ name: `environments/${env.name}`, title: env.desc })
        })
    }

    const navs = [
      {
        cate: '',
        items: [
          {
            name: 'overview',
            title: '概览',
            icon: 'dashboard',
            skipAuth: true,
          },
          {
            name: 'environments',
            title: '应用环境',
            icon: 'application',
            skipAuth: true,
            open: true,
            children: envItems,
          },
        ],
      },
    ]

    return navs
  }

  render() {
    const { match, route, location } = this.props
    const { initializing, detail } = this.store

    if (initializing) {
      return <Loading className={styles.loading} />
    }

    return (
      <div className="ks-page">
        <div className="ks-page-side">
          <Selector
            type="devops"
            title={t('DevOps应用')}
            detail={detail}
            onChange={this.handleChange}
            workspace={this.workspace}
          />
          <Nav
            className="ks-page-nav"
            navs={this.generateNavs()}
            location={location}
            match={match}
          />
        </div>

        <div className="ks-page-main">{renderRoutes(route.routes)}</div>
      </div>
    )
  }
}

export default DevOpsAppListLayout
