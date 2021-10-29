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
import { get } from 'lodash'
import { observer, inject } from 'mobx-react'

import { Tag } from '@kube-design/components'
import { Avatar, Status } from 'components/Base'
import Banner from 'components/Cards/Banner'
import withList, { ListPage } from 'components/HOCs/withList'
import { parse } from 'qs'

import Table from 'components/Tables/List'
import EnvSelect from 'devopsapps/components/EnvSelect'

import { getLocalTime, getDisplayName } from 'utils'
import { ALERTING_STATUS } from 'utils/alerting'
import { SEVERITY_LEVEL } from 'configs/alerting/metrics/rule.config'

import PolicyStore from 'stores/alerting/policy'

@observer
@inject('rootStore', 'devopsappStore')
@withList({
  store: new PolicyStore(),
  module: 'rules',
  authKey: 'alert-rules',
  name: 'Alerting Policy',
})
export default class AlertingPolicy extends React.Component {

  constructor(props) {
    super(props)

    this.lastSelectedEnv = localStorage.getItem(`selected-env-${this.devopsapp}`)
    this.queryParams = parse(location.search.slice(1))
    this.state = {
      type: location.search.indexOf('type=builtin') > 0 ? 'builtin' : 'custom',
      env: this.defaultEnv
    }
  }

  componentDidMount() {
  }

  get defaultEnv() {
    if(this.lastSelectedEnv) return this.lastSelectedEnv
    return this.queryParams.env ? this.queryParams.env : get(this.environments, '0.name')
  }

  get environments() {
    return get(this.props.devopsappStore, 'data.spec.environments', [])
  }

  get envInfo() {
    const envs = this.environments
    const currentEnv = this.state.env
    for (const env of envs) {
      if (env.name === currentEnv) {
        return env
      }
    }
    return {}
  }

  get devopsapp() {
    return this.props.devopsappStore.devopsapp
  }

  get worksapce() {
    return this.props.match.params.worksapce
  }

  get cluster() {
    return this.envInfo.cluster
  }

  get namespace() {
    return `${this.state.env}-${this.devopsapp}`
  }

  get tabs() {
    return {
      value: this.state.type,
      onChange: this.handleTabChange,
      options: [
        {
          value: 'custom',
          label: t('Custom Policies'),
          count: this.props.store.ruleCount,
        },
        {
          value: 'builtin',
          label: t('Built-In Policies'),
          count: this.props.store.builtinRuleCount,
        },
      ],
    }
  }

  handleEnvChange = env => {
    localStorage.setItem(`selected-env-${this.devopsapp}`, env)
    this.setState({
      env
    }, () => {
      this.getData()
    })
  }

  handleTabChange = type => {
    this.setState({ type }, () => {
      this.props.store.list.reset()
      this.getData()
    })
  }

  getData = async ({ silent, ...params } = {}) => {
    const store = this.props.store

    silent && (store.list.silent = true)
    params && (params.env = null)
    await store.fetchList({
      ...params,
      type: this.state.type,
      worksapce: this.worksapce,
      cluster: this.cluster,
      namespace: this.namespace,
    })
    store.list.silent = false
  }

  get tips() {
    return [
      {
        title: t('REQUESTS_FOR_PUSH_AN_ALARM_Q'),
        description: t('REQUESTS_FOR_PUSH_AN_ALARM_A'),
      },
      {
        title: t('HOW_TO_SUPRESS_AN_ALARM_Q'),
        description: t('HOW_TO_SUPRESS_AN_ALARM_A'),
      },
    ]
  }

  get itemActions() {
    const { trigger, routing, module, name } = this.props
    return [
      {
        key: 'edit',
        icon: 'pen',
        text: t('Edit'),
        action: 'edit',
        onClick: item =>
          trigger('alerting.policy.create', {
            detail: item,
            module,
            cluster: this.cluster,
            namespace: this.namespace,
            title: `${t('Edit ')}${t('alerting policy')}`,
            success: this.getData,
          }),
      },
      {
        key: 'delete',
        icon: 'trash',
        text: t('Delete'),
        action: 'delete',
        onClick: item =>
          trigger('resource.delete', {
            type: t(name),
            detail: item,
            success: this.getData,
          }),
      },
    ]
  }

  getStatus() {
    return ALERTING_STATUS.map(status => ({
      text: t(`ALERT_RULE_${status.toUpperCase()}`),
      value: status,
    }))
  }

  getAlertingTypes() {
    return SEVERITY_LEVEL.map(level => ({
      text: t(level.label),
      value: level.value,
    }))
  }

  getColumns = () => {
    const { getFilteredValue } = this.props
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
        search: true,
        render: (name, record) => {
          const prefix = `/${this.workspace}/clusters/${this.cluster}/projects/${this.namespace}/${this.devopsapp}`
          const to = this.state.type === 'builtin' 
            ? `${prefix}/alert-rules/builtin/${record.id}` 
            : `${prefix}/alert-rules/${name}`

          return (
            <Avatar
              icon="wrench"
              title={getDisplayName(record)}
              desc={record.desc}
              to={to}
          />
        )},
      },
      {
        title: t('Alerting Status'),
        dataIndex: 'state',
        filters: this.getStatus(),
        filteredValue: getFilteredValue('state'),
        isHideable: true,
        search: true,
        width: '16%',
        render: state => (
          <Status
            type={state}
            name={t(`ALERT_RULE_${state.toUpperCase()}`, {
              defaultValue: state,
            })}
          />
        ),
      },
      {
        title: t('Alerting Type'),
        dataIndex: 'labels.severity',
        filters: this.getAlertingTypes(),
        filteredValue: getFilteredValue('labels.severity'),
        isHideable: true,
        search: true,
        width: '16%',
        render: severity => {
          const level = SEVERITY_LEVEL.find(item => item.value === severity)
          if (level) {
            return <Tag type={level.type}>{t(level.label)}</Tag>
          }
          return <Tag>{severity}</Tag>
        },
      },
      {
        title: t('Alert Active Time'),
        dataIndex: 'alerts',
        isHideable: true,
        width: '16%',
        render: (alerts = []) => {
          const time = get(alerts, `${alerts.length - 1}.activeAt`)
          return time ? getLocalTime(time).format('YYYY-MM-DD HH:mm:ss') : '-'
        },
      },
    ]
  }

  showCreate = () => {
    const { module } = this.props
    return this.props.trigger('alerting.policy.create', {
      module,
      cluster: this.cluster,
      namespace: this.namespace,
      title: `${t('Add ')}${t('alerting policy')}`,
      success: this.getData,
    })
  }

  render() {
    const { bannerProps, tableProps } = this.props
    const namespace = this.namespace
    const envs = this.environments
    const defaultEnv = this.defaultEnv

    let rowKey = 'name'
    let itemActions = this.itemActions
    let onCreate = this.showCreate
    if (this.state.type === 'builtin') {
      tableProps.selectActions = []
      itemActions = []
      onCreate = null
      rowKey = 'id'
    }

    return (
      <ListPage {...this.props} getData={this.getData} noWatch>
        <Banner
          {...bannerProps}
          tips={this.tips}
          tabs={namespace ? {} : this.tabs}
          title={t('Alerting Policies')}
          description={t('ALERT_POLICY_DESC')}
        />
        <Table
          {...tableProps}
          rowKey={rowKey}
          itemActions={itemActions}
          columns={this.getColumns()}
          onCreate={onCreate}
          showEmpty={false}
          customFilter={<EnvSelect defaultEnv={defaultEnv} envs={envs} onChange={this.handleEnvChange}/>}
        />
      </ListPage>
    )
  }
}
