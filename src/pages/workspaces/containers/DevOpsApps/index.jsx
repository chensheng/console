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

import React from 'react'
import { computed } from 'mobx'

import { Avatar, Status } from 'components/Base'
import Banner from 'components/Cards/Banner'
import Table from 'workspaces/components/ResourceTable'
import withList, { ListPage } from 'components/HOCs/withList'

import { getLocalTime, getDisplayName } from 'utils'

import DevOpsAppStore from 'stores/devopsapp'

@withList({
  store: new DevOpsAppStore(),
  name: 'DevOps App',
  module: 'devopsapps',
  rowKey: 'name',
  injectStores: ['rootStore', 'workspaceStore'],
})
export default class DevOpsApps extends React.Component {
  workspaceStore = this.props.workspaceStore

  get itemActions() {
    const { trigger, name } = this.props
    return [
      {
        key: 'edit',
        icon: 'pen',
        text: t('Edit'),
        action: 'edit',
        onClick: item => trigger('devops.edit', { detail: item }),
      },
      {
        key: 'delete',
        icon: 'trash',
        text: t('Delete'),
        action: 'delete',
        onClick: item => {
          trigger('resource.delete', {
            type: t(name),
            resource: item.name,
            detail: item,
          })
        },
      },
    ]
  }

  get tips() {
    return [
      {
        title: t('DEVOPS_TIP_GITOPS_Q'),
        description: t('DEVOPS_TIP_GITOPS_A'),
      },
      {
        title: t('DEVOPS_TIP_TYPE_Q'),
        description: t('DEVOPS_TIP_TYPE_A'),
      },
    ]
  }

  get workspace() {
    return this.props.match.params.workspace
  }

  get clusterProps() {
    return {
      clusters: ["default"],
      showClusterSelect: false,
    }
  }

  get tableActions() {
    const { tableProps, trigger } = this.props
    return {
      ...tableProps.tableActions,
      selectActions: [
        {
          key: 'delete',
          type: 'danger',
          text: t('Delete'),
          action: 'delete',
          onClick: () => {
            trigger('devops.batch.delete', {
              type: t(tableProps.name),
              rowKey: tableProps.rowKey,
            })
          },
        },
      ],
    }
  }

  getData = async ({ silent, ...params } = {}) => {
    const { store } = this.props

    silent && (store.list.silent = true)
    const { cluster } = this.workspaceStore
    if (cluster) {
      await store.fetchList({
        cluster,
        ...this.props.match.params,
        ...params,
      })
    }
    store.list.silent = false
  }

  getColumns = () => [
    {
      title: t('Name'),
      dataIndex: 'name',
      render: (name, record) => {
        const isTerminating = record.status === 'Terminating'
        return (
          <>
            <Avatar
              icon="strategy-group"
              iconSize={40}
              to={`/${this.workspace}/devopsapps/${name}`}
              desc={record.description || '-'}
              title={getDisplayName(record)}
            />
          </>
        )
      },
    },
    {
      title: t('ID'),
      dataIndex: 'namespace',
      isHideable: true,
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      isHideable: true,
      render: status => <Status type={status} name={t(status)} flicker />,
    },
    {
      title: t('Creator'),
      dataIndex: 'creator',
      isHideable: true,
      render: creator => creator || '-',
    },
    {
      title: t('Created Time'),
      dataIndex: 'createTime',
      isHideable: true,
      sorter: true,
      render: time => getLocalTime(time).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  showCreate = () =>
    this.props.trigger('devops.create', {
      ...this.props.match.params,
      cluster: this.workspaceStore.cluster,
      success: cluster => {
        if (cluster) {
          this.workspaceStore.selectCluster(cluster)
        }
        this.getData({ silent: true })
      },
    })

  getCheckboxProps = record => ({
    disabled: record.status === 'Terminating',
    name: record.name,
  })

  render() {
    const { bannerProps, tableProps, match } = this.props
    const matchParams = {
      ...match,
      params: {
        ...match.params,
        cluster: this.workspaceStore.cluster,
      },
    }

    return (
      <ListPage {...this.props} getData={this.getData} match={matchParams}>
        <Banner
          {...bannerProps}
          title={t('DevOps应用')}
          description={t('DEVOPS_DESCRIPTION')}
          tips={this.tips}
        />
        <Table
          {...tableProps}
          itemActions={this.itemActions}
          tableActions={this.tableActions}
          columns={this.getColumns()}
          onCreate={this.showCreate}
          searchType="name"
          isLoading={tableProps.isLoading}
          {...this.clusterProps}
          getCheckboxProps={this.getCheckboxProps}
        />
      </ListPage>
    )
  }
}
