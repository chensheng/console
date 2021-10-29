import React from 'react'
import { observer, inject } from 'mobx-react'
import { capitalize, get } from 'lodash'
import { Link } from 'react-router-dom'

import { Tag } from '@kube-design/components'

import { Text, Status } from 'components/Base'
import Banner from 'components/Cards/Banner'
import withList, { ListPage } from 'components/HOCs/withList'

import Table from 'components/Tables/List'
import EnvSelect from 'devopsapps/components/EnvSelect'

import { getLocalTime } from 'utils'
import { ALERTING_STATUS } from 'utils/alerting'

import { SEVERITY_LEVEL } from 'configs/alerting/metrics/rule.config'

import MessageStore from 'stores/alerting/message'

@observer
@inject('rootStore', 'devopsappStore')
@withList({
  store: new MessageStore(),
  module: 'alerts',
  name: 'Alerting Message',
})
export default class AlertingMessages extends React.Component {
  
  constructor(props) {
    super(props)
    
    this.lastSelectedEnv = localStorage.getItem(`selected-env-${this.devopsapp}`)
    this.state = {
      type: location.search.indexOf('type=builtin') > 0 ? 'builtin' : 'custom',
      env: this.defaultEnv
    }
  }

  get defaultEnv() {
    if(this.lastSelectedEnv) return this.lastSelectedEnv
    return get(this.environments, '0.name')
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

  get workspace() {
    return this.props.match.params.workspace
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

  get tips() {
    return [
      {
        title: t('REQUESTS_FOR_TRIGGER_AN_ALARM_Q'),
        description: t('REQUESTS_FOR_TRIGGER_AN_ALARM_A'),
      },
    ]
  }

  getData = params => {
    this.props.store.fetchList({
      ...params,
      type: this.state.type,
      cluster: this.cluster,
      namespace: this.namespace,
      workspace: this.workspace,
    })
  }

  getTableProps() {
    const { tableProps } = this.props
    return {
      tableActions: {
        ...tableProps.tableActions,
        selectActions: [],
      },
      emptyProps: {
        desc: t('ALERT_MESSAGE_DESC'),
      },
    }
  }

  getResourceType = type => {
    const str = capitalize(type)
    return t('ALERT_TYPE', { type: t(str) })
  }

  getAlertingTypes() {
    return SEVERITY_LEVEL.map(level => ({
      text: t(level.label),
      value: level.value,
    }))
  }

  getStatus() {
    return ALERTING_STATUS.map(status => ({
      text: t(`ALERT_RULE_${status.toUpperCase()}`),
      value: status,
    }))
  }

  getColumns = () => {
    const { getFilteredValue } = this.props
    return [
      {
        title: t('Alerting Message'),
        dataIndex: 'value',
        render: (value, record) => (
          <Text
            icon="loudspeaker"
            title={get(record, 'annotations.summary')}
            description={get(record, 'annotations.message', '-')}
          />
        ),
      },
      {
        title: t('Alerting Status'),
        dataIndex: 'state',
        filters: this.getStatus(),
        filteredValue: getFilteredValue('state'),
        isHideable: true,
        search: true,
        width: '12%',
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
        width: '12%',
        render: severity => {
          const level = SEVERITY_LEVEL.find(item => item.value === severity)
          if (level) {
            return <Tag type={level.type}>{t(level.label)}</Tag>
          }
          return <Tag>{severity}</Tag>
        },
      },
      {
        title: t('Alerting Policy'),
        dataIndex: 'ruleName',
        isHideable: true,
        width: '12%',
        render: (ruleName, record) => {
          const prefix = `/${this.workspace}/clusters/${this.cluster}/projects/${this.namespace}/${this.devopsapp}`
          const to = this.state.type === 'builtin' 
            ? `${prefix}/alert-rules/builtin/${record.ruleId}` 
            : `${prefix}/alert-rules/${ruleName}`
          return (
            <Link
              to={to}
            >
              {ruleName}
            </Link>
          )},
      },
      {
        title: t('Alert Active Time'),
        dataIndex: 'activeAt',
        isHideable: true,
        width: 200,
        render: time => getLocalTime(time).format('YYYY-MM-DD HH:mm:ss'),
      },
    ]
  }

  render() {
    const { bannerProps, tableProps } = this.props
    const namespace = this.namespace
    const envs = this.environments
    const defaultEnv = this.defaultEnv

    return (
      <ListPage {...this.props} getData={this.getData} noWatch>
        <Banner
          {...bannerProps}
          tips={this.tips}
          tabs={namespace ? {} : this.tabs}
          icon="loudspeaker"
          title={t('Alerting Messages')}
          description={t('ALERT_MESSAGE_DESC')}
        />
        <Table
          {...tableProps}
          {...this.getTableProps()}
          rowKey="id"
          itemActions={[]}
          columns={this.getColumns()}
          onCreate={this.showCreate}
          showEmpty={false}
          customFilter={<EnvSelect defaultEnv={defaultEnv} envs={envs} onChange={this.handleEnvChange}/>}
        />
      </ListPage>
    )
  }
}
