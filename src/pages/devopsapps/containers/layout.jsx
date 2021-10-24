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
import { pick, set, get  } from 'lodash'
import { inject, observer, Provider } from 'mobx-react'
import { Loading } from '@kube-design/components'

import { renderRoutes } from 'utils/router.config'

import DevOpsAppStore from 'stores/devopsapp'

@inject('rootStore')
@observer
export default class Layout extends Component {
  constructor(props) {
    super(props)
    this.store = new DevOpsAppStore()
  }

  get devopsapp() {
    return this.props.match.params.devopsapp
  }

  get workspace() {
    return this.props.match.params.workspace
  }

  get routing() {
    return this.props.rootStore.routing
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.devopsapp !== this.devopsapp) {
      this.init()
    }
  }

  async init() {
    this.store.initializing = true
    const params = {
      devopsapp: this.devopsapp,
      workspace: this.workspace,
    }

    await Promise.all([
      this.store.fetchDetail(params),
      this.props.rootStore.getRules({ workspace: this.workspace }),
    ])

    const environments = get(this.store.data, "spec.environments")
    if(environments && environments.length) {
      for(let env of environments) {
        const namespace = `${env.name}-${this.devopsapp}`
        const cluster = env.cluster
        await this.props.rootStore.getRules({
          namespace,
          cluster
        })
      }
    }

    globals.app.cacheHistory(this.props.match.url, {
      type: 'DevOpsApp',
      name: this.devopsapp,
      aliasName: this.store.data.aliasName,
    })

    this.store.initializing = false
  }

  render() {
    const { initializing } = this.store
    if (initializing) {
      return <Loading className="ks-page-loading" />
    }
    return (
      <Provider devopsappStore={this.store}>
        {renderRoutes(this.props.route.routes)}
      </Provider>
    )
  }
}
