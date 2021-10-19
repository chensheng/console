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
import PropTypes from 'prop-types'
import { get, omit, debounce, isArray, isUndefined, isEmpty } from 'lodash'
import { Link } from 'react-router-dom'
import { toJS } from 'mobx'
import { parse } from 'qs'
import { observer, inject } from 'mobx-react'
import {
  Button,
  Notify,
  Level,
  LevelLeft,
  LevelRight,
} from '@kube-design/components'

import { getLocalTime, formatUsedTime } from 'utils'

import Status from 'devops/components/Status'
import { getPipelineStatus } from 'utils/status'
import { ReactComponent as ForkIcon } from 'assets/fork.svg'

import { trigger } from 'utils/action'
import Table from 'components/Tables/List'
import EmptyCard from 'devops/components/Cards/EmptyCard'
import { Panel } from 'components/Base'

import styles from './index.scss'

import DevopsStore from 'stores/devops'
import PipelineStore from 'stores/devops/pipelines'

@inject('rootStore')
@observer
@trigger
export default class Pipeline extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    workspace: PropTypes.string,
    cluster: PropTypes.string,
    devopsName: PropTypes.string,
    pipeline: PropTypes.string,
  }

  static defaultProps = {
    title: '',
    workspace: null,
    cluster: null,
    devopsName: null,
    pipeline: null,
  }

  store = new PipelineStore()

  devopsStore = new DevopsStore()

  refreshTimer = setInterval(() => this.refreshHandler(), 4000)

  get enabledActions() {
    return globals.app.getActions({
      module: 'pipelines',
      cluster: this.props.cluster,
      devops: this.devopsStore.devops,
    })
  }

  get isRuning() {
    const data = get(toJS(this.store), 'activityList.data', [])
    const runingData = data.filter(
      item => item.state !== 'FINISHED' && item.state !== 'PAUSED'
    )
    return !isEmpty(runingData)
  }

  get isAtBranchDetailPage() {
    return this.props.match&&this.props.match.params&&this.props.match.params.branch
  }

  get prefix() {
    const {  workspace, cluster, pipeline } = this.props;
    return `/${workspace}/clusters/${cluster}/devops/${this.devopsStore.devops}/pipelines/${pipeline}`
  }

  get routing() {
    return this.props.rootStore.routing
  }

  componentDidMount() {
    localStorage.setItem('pipeline-activity-detail-referrer', location.pathname)
    this.fetchDevopsData()
  }

  componentDidUpdate(prevProps) {
    if (this.refreshTimer === null && this.isRuning) {
      this.refreshTimer = setInterval(() => this.refreshHandler(), 4000)
    }
  }

  componentWillUnmount() {
    clearInterval(this.refreshTimer)
    this.unsubscribe && this.unsubscribe()
  }

  getData = () => {
    const query = parse(location.search.slice(1))

    const activitiesParams = {
      ...query,
      name: this.props.pipeline,
      devops: this.devopsStore.devops,
      cluster: this.props.cluster,
    }

    this.store.getActivities(activitiesParams)
  }

  fetchDevopsData = async () => {
    const params = {
      workspace: this.props.workspace,
      cluster: this.props.cluster,
      name: this.props.devopsName
    }
    await this.devopsStore.fetchDetailByName(params)
    this.getData()
  }

  refreshHandler = () => {
    if (this.isRuning) {
      this.getData()
    } else {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  handleRunning = debounce(async () => {
    const { detail } = this.store
    const isMultibranch = detail.branchNames
    const params = {
     devops: this.devopsStore.devops,
      cluster: this.props.cluster,
      name: this.props.pipeline
    }
    const hasParameters = detail.parameters && detail.parameters.length

    if (isMultibranch || hasParameters) {
      this.trigger('pipeline.params', {
        devops: this.devopsStore.devops,
        cluster: this.props.cluster,
        params,
        branches: toJS(detail.branchNames),
        parameters: toJS(detail.parameters),
        success: () => {
          Notify.success({ content: `${t('Run Start')}` })
          this.handleFetch()
        },
      })
    } else {
      Notify.success({ content: `${t('Run Start')}` })
      await this.store.runBranch(params)
      this.handleFetch()
    }
  }, 500)

  handleFetch = (params, refresh) => {
    this.routing.query(params, refresh)
  }

  handleReplay = record => async () => {
    const url = `devops/${this.devopsStore.devops}/pipelines/${this.props.pipeline}${this.getActivityDetailLinks(record)}`

    await this.store.handleActivityReplay({ url, cluster: this.props.cluster, })

    Notify.success({ content: `${t('Run Start')}` })
    this.handleFetch()
  }

  handleScanRepository = async () => {
    const { params } = this.props.match
    const { detail } = this.store

    await this.store.scanRepository({
      devops: this.devopsStore.devops,
      name: detail.name,
      cluster: this.props.cluster,
    })

    const detailParams = {
      ...params,
      devops: this.devopsStore.devops,
      cluster: this.props.cluster,
      name: detail.name,
    }
    this.store.fetchDetail(detailParams)

    Notify.success({
      content: t('Scan repo success'),
    })

    this.handleFetch()
  }

  handleStop = record => async () => {
    const url = `devops/${this.devopsStore.devops}/pipelines/${this.props.pipeline}${this.getActivityDetailLinks(record)}`

    await this.store.handleActivityStop({
      url,
      cluster: this.props.cluster,
    })

    Notify.success({
      content: t('Stop Job Successfully, Status updated later'),
    })

    this.handleFetch()
  }

  getActivityDetailLinks = record => {
    const matchArray = get(record, '_links.self.href', '').match(
      /\/pipelines\/\S*?(?=\/)\/branches\/(\S*?(?=\/)?)\//
    )
    if (isArray(matchArray)) {
      return `/branches/${encodeURIComponent(record.pipeline)}/runs/${
        record.id
      }`
    }
    return `/runs/${record.id}`
  }

  getRunhref = record => {
    const matchArray = get(record, '_links.self.href', '').match(
      /\/pipelines\/\S*?(?=\/)\/branches\/(\S*?(?=\/)?)\//
    )
    if (isArray(matchArray) && !this.isAtBranchDetailPage) {
      return `${this.prefix}/branch/${record.pipeline}/run/${record.id}`
    }
    return `${this.prefix}/run/${record.id}`
  }

  getColumns = () => [
    {
      title: t('Status'),
      width: '15%',
      key: 'status',
      render: record => (
        <Link className="item-name" to={this.getRunhref(record)}>
          <Status {...getPipelineStatus(record)} />
        </Link>
      ),
    },
    {
      title: t('Run'),
      width: '10%',
      key: 'run',
      render: record => (
        <Link className="item-name" to={this.getRunhref(record)}>
          {record.id}
        </Link>
      ),
    },
    {
      title: t('Commit'),
      dataIndex: 'commitId',
      width: '10%',
      render: commitId => (commitId && commitId.slice(0, 6)) || '-',
    },
    ...(this.props.match&&this.props.match.params&&this.props.match.params.branch
      ? []
      : [
          {
            title: t('Branch'),
            width: '15%',
            key: 'branch',
            render: record => {
              const matchArray = get(record, '_links.self.href', '').match(
                /\/pipelines\/\S*?(?=\/)\/branches\/(\S*?(?=\/)?)\//
              )
              if (isArray(matchArray)) {
                return (
                  <Link
                    className="item-name"
                    to={`${this.prefix}/branch/${record.pipeline}/activity`}
                  >
                    <ForkIcon style={{ width: '20px', height: '20px' }} />{' '}
                    {decodeURIComponent(record.pipeline)}
                  </Link>
                )
              }
              return '-'
            },
          },
        ]),
    {
      title: t('Last Message'),
      dataIndex: 'causes',
      width: '25%',
      render: causes => get(causes, '[0].shortDescription', ''),
    },
    {
      title: t('Duration'),
      dataIndex: 'durationInMillis',
      width: '10%',
      render: durationInMillis =>
        durationInMillis ? formatUsedTime(durationInMillis) : '-',
    },
    {
      title: t('Updated Time'),
      dataIndex: 'startTime',
      width: '20%',
      render: time => getLocalTime(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      isHideable: false,
      width: '10%',
      key: 'action',
      render: record => {
        if (
          (record.branch && !record.commitId) ||
          !this.enabledActions.includes('edit')
        ) {
          return null
        }
        if (record.state === 'FINISHED') {
          return (
            <Button
              onClick={this.handleReplay(record)}
              icon="restart"
              type="flat"
            />
          )
        }
        return (
          <Button onClick={this.handleStop(record)} icon="stop" type="flat" />
        )
      },
    },
  ]

  getActions = () =>
    this.isAtBranchDetailPage
      ? null
      : [
          {
            type: 'control',
            key: 'run',
            text: t('Run'),
            action: 'edit',
            onClick: this.handleRunning,
          },
        ]
  
    renderFooter = () => {
    const { detail, activityList } = this.store
    const { total, limit } = activityList
    const isMultibranch = detail.branchNames

    if (!isMultibranch || this.isAtBranchDetailPage) {
      return null
    }

    if (total < limit) {
      return null
    }

    return () => (
      <Level>
        {!isUndefined(total) && (
          <LevelLeft>{t('TOTAL_ITEMS', { num: total })}</LevelLeft>
        )}
        <LevelRight>
          <Link className={styles.clickable} to="./branch">
            {t('PIPELINES_FOOTER_SEE_MORE')}
          </Link>
        </LevelRight>
      </Level>
    )
  }
  
  renderFooter = () => {
    const { detail, activityList } = this.store
    const { total, limit } = activityList
    const isMultibranch = detail.branchNames

    if (!isMultibranch || this.isAtBranchDetailPage) {
      return null
    }

    if (total < limit) {
      return null
    }

    return () => (
      <Level>
        {!isUndefined(total) && (
          <LevelLeft>{t('TOTAL_ITEMS', { num: total })}</LevelLeft>
        )}
        <LevelRight>
          <Link className={styles.clickable} to="./branch">
            {t('PIPELINES_FOOTER_SEE_MORE')}
          </Link>
        </LevelRight>
      </Level>
    )
  }

  render() {
    const { activityList } = this.store
    const { data, isLoading, total, page, limit, filters } = activityList
    const omitFilters = omit(filters, 'page', 'workspace')
    const pagination = { total, page, limit }
    const isEmptyList = total === 0

    if (isEmptyList) {
      const { detail } = this.store
      const runnable = this.enabledActions.includes('edit')
      const isMultibranch = detail.branchNames
      const isBranchInRoute = get(this.props, 'match.params.branch')

      if (isMultibranch && !isEmpty(isMultibranch) && !isBranchInRoute) {
        return (
          <Panel title={t(this.props.title)}>
            <EmptyCard desc={t('Pipeline config file not found')}>
              {runnable && (
                <Button type="control" onClick={this.handleScanRepository}>
                  {t('Scan Repository')}
                </Button>
              )}
            </EmptyCard>
          </Panel>
        )
      }

      return (
        <Panel title={t(this.props.title)}>
          <EmptyCard desc={t('ACTIVITY_EMPTY_TIP')}>
            {runnable && (
              <Button type="control" onClick={this.handleRunning}>
                {t('Run Pipeline')}
              </Button>
            )}
          </EmptyCard>
        </Panel>
      )
    }

    const rowKey = get(data[0], 'time') ? 'time' : 'endTime'

    return (
      <Panel title={this.props.title}>
        <Table
          data={toJS(data)}
          columns={this.getColumns()}
          rowKey={rowKey}
          filters={omitFilters}
          pagination={pagination}
          isLoading={isLoading}
          onFetch={this.handleFetch}
          actions={this.getActions()}
          footer={this.renderFooter()}
          hideSearch
          enabledActions={this.enabledActions}
        />
      </Panel>
    )
  }
}
