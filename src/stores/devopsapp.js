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

import { set, get, isArray, omit, cloneDeep } from 'lodash'
import { action, observable } from 'mobx'

import Base from 'stores/base'

import RoleStore from 'stores/role'

export default class DevOpsAppStore extends Base {
  @observable
  initializing = true

  roleStore = new RoleStore()

  module = 'devopsapps'

  @observable
  roles = {
    data: [],
    page: 1,
    total: 0,
    isLoading: true,
  }

  @observable
  data = {}

  detail = {}

  @observable
  devopsappListData = []

  @observable
  devopsapp = ''

  @observable
  devopsappName = ''

  getPath({ cluster, namespace, workspace } = {}) {
    let path = ''
    if (cluster) {
      path += `/klusters/${cluster}`
    }
    if (workspace) {
      path += `/workspaces/${workspace}`
    }
    if (namespace) {
      path += `/namespaces/${namespace}`
    }
    return path
  }

  getBaseUrlV2 = params =>
    `kapis/devops.kubesphere.io/v1alpha2${this.getPath(params)}/`

  getBaseUrlV3 = params => `apis/devops.kubesphere.io/v1alpha3/devopsapps`

  getDevopsUrlV2 = params => `${this.getBaseUrlV2(params)}devopsapps/`

  getResourceUrl = ({ workspace }) =>
    `${this.getBaseUrlV2({ workspace })}devopsapps`

  getBaseUrl = params => `${this.apiVersion}${this.getPath(params)}/`

  getDevOpsAppsUrl = params => `${this.getBaseUrlV3(params)}`

  getDevOpsAppDetailUrl = ({ workspace, devopsapp }) =>
    `${this.getDevOpsAppsUrl({ workspace })}/${devopsapp}`

  getWatchListUrl = ({ workspace, ...params }) => {
    return `apis/devops.kubesphere.io/v1alpha3/watch${this.getPath(
      params
    )}/devopsapps?labelSelector=kubesphere.io/workspace=${workspace}`
  }

  getWatchUrl = (params = {}) =>
    `${this.getWatchListUrl(params)}/${params.name}`

  getDevopsapp(devopsapp) {
    return devopsapp.slice(0, -5)
  }

  @action
  async fetchList({ workspace, more, ...params } = {}) {
    this.list.isLoading = true

    if (params.limit === Infinity || params.limit === -1) {
      params.limit = -1
      params.page = 1
    } else {
      params.limit = params.limit || 10
    }
    params['labelSelector'] = `kubesphere.io/workspace=${workspace}`

    const result =
      (await request
        .get(this.getBaseUrlV3({ workspace }), params)
        .catch(() => {})) || {}

    const items = Array.isArray(get(result, 'items'))
      ? get(result, 'items')
      : []

    this.devopsappListData = items

    const data = items.map(item => ({
      ...this.mapper(item),
    }))

    this.list.update({
      data: more ? [...this.list.data, ...data] : data,
      total: result.totalItems || data.length || 0,
      limit: Number(params.limit) || 10,
      page: Number(params.page) || 1,
      isLoading: false,
      ...(this.list.silent ? {} : { selectedRowKeys: [] }),
      ...omit(params, ['limit', 'page']),
    })
  }

  @action
  create(data, { workspace }) {
    data.kind = 'DevOpsApp'
    data.apiVersion = 'devops.kubesphere.io/v1alpha3'
    data.metadata.labels = { 'kubesphere.io/workspace': workspace }
    return this.submitting(
      request.post(this.getDevOpsAppsUrl({ workspace }), data)
    )
  }

  @action
  async update({ workspace, devopsapp }, newData) {
    await this.fetchDetail({ workspace, devopsapp })
    const data = cloneDeep(this.itemDetail)

    if (data) {
      set(
        data,
        'metadata.annotations["kubesphere.io/description"]',
        newData.description
      )

      set(
        data,
        'metadata.annotations["kubesphere.io/alias-name"]',
        newData.aliasName
      )

      return this.submitting(
        request.put(
          `${this.getDevOpsAppDetailUrl({ workspace, devopsapp })}`,
          data,
          {
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      )
    }
  }

  @action
  delete({ devopsapp, workspace }) {
    return this.submitting(
      request.delete(`${this.getDevOpsAppDetailUrl({ workspace, devopsapp })}`)
    )
  }

  @action
  batchDelete(rowKeys, params) {
    const { workspace, devopsapp } = params
    return this.submitting(
      Promise.all(
        rowKeys.map(devopsappName =>
          request.delete(
            `${this.getDevOpsAppDetailUrl({
              workspace,
              devopsapp,
            })}`
          )
        )
      )
    )
  }

  @action
  async fetchDetail({ devopsapp, workspace }) {
    const result = await request.get(
      this.getDevOpsAppDetailUrl({ workspace, devopsapp }),
      null,
      null,
      res => {
        if (res.reason === 'Not Found' || res.reason === 'Forbidden') {
          global.navigateTo('/404')
        }
      }
    )

    this.itemDetail = result
    const data = { ...this.mapper(result) }
    this.devopsappName = data.name
    this.devopsapp = data.devopsapp
    data.workspace = data.workspace || workspace
    this.data = data
    this.detail = data
  }

  @action
  async fetchRoles({ cluster, devops }) {
    this.roles.isLoading = true
    const result = await request.get(
      `${this.getListUrl({ cluster })}/${devops}/defaultroles`
    )
    if (isArray(result)) {
      this.roles.data = result.map(role => {
        role.description = t(`pipeline_${role.name}`)
        return role
      })
      this.roles.total = result.length
    }
    this.roles.isLoading = false
  }

  @action
  setSelectRowKeys = selectedRowKeys => {
    this.list.selectedRowKeys = selectedRowKeys
  }

  @action
  async fetchListByUser({
    cluster,
    workspace,
    namespace,
    username,
    type,
    ...params
  } = {}) {
    this.list.isLoading = true

    if (!params.sortBy && params.ascending === undefined) {
      params.sortBy = 'createTime'
    }

    if (params.limit === Infinity || params.limit === -1) {
      params.limit = -1
      params.page = 1
    }

    params.limit = params.limit || 10

    const result = await request.get(
      `kapis/tenant.kubesphere.io/v1alpha2/workspaces/${workspace}${this.getPath(
        { cluster, namespace }
      )}/workspacemembers/${username}/devops`,
      params
    )
    const data = get(result, 'items', []).map(item => ({
      cluster,
      ...this.mapper(item),
    }))

    this.list.update({
      data,
      total: result.totalItems || 0,
      ...params,
      cluster: globals.app.isMultiCluster ? cluster : undefined,
      limit: Number(params.limit) || 10,
      page: Number(params.page) || 1,
      isLoading: false,
    })

    return data
  }
}
